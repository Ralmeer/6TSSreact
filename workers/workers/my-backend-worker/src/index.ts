import { createClient } from '@supabase/supabase-js';

export interface Env {
	SUPABASE_URL: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
	FRONTEND_URL: string;
}

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

function generateRandomPassword() {
	const length = 12;
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
	let password = "";
	for (let i = 0; i < length; i++) {
		password += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return password;
}

// Helper function to create a Supabase client

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		let response;

		const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

		const origin = request.headers.get('Origin');
		const allowedMethods = 'GET, POST, PUT, DELETE, OPTIONS';
		const allowedHeaders = request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization';
		let frontendUrl = env.FRONTEND_URL || '*';
		if (frontendUrl !== '*') {
			frontendUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
		}
		console.log('Worker FRONTEND_URL (after processing):', frontendUrl); // New debugging line

		const handleCors = (response: Response) => {
			const corsHeaders: HeadersInit = {
				'Access-Control-Allow-Methods': allowedMethods,
				'Access-Control-Allow-Headers': allowedHeaders,
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Max-Age': '86400',
				'Vary': 'Origin',
			};

			// Dynamically set Access-Control-Allow-Origin based on request Origin if it matches frontendUrl
			if (origin && (frontendUrl === '*' || origin === frontendUrl)) {
				(corsHeaders as Record<string, string>)['Access-Control-Allow-Origin'] = origin;
			} else {
				(corsHeaders as Record<string, string>)['Access-Control-Allow-Origin'] = frontendUrl;
			}

			for (const [key, value] of Object.entries(corsHeaders)) {
				response.headers.set(key, value);
			}
			return response;
		};

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			console.log('Handling OPTIONS request.');
			console.log('Origin from request:', origin);
			console.log('Frontend URL from env (processed):', frontendUrl);
			const preflightHeaders: HeadersInit = {
				'Access-Control-Allow-Methods': allowedMethods,
				'Access-Control-Allow-Headers': allowedHeaders,
				'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
			};

			// Dynamically set Access-Control-Allow-Origin for preflight requests
			if (origin && (frontendUrl === '*' || origin === frontendUrl)) {
				(preflightHeaders as Record<string, string>)['Access-Control-Allow-Origin'] = origin;
			} else {
				(preflightHeaders as Record<string, string>)['Access-Control-Allow-Origin'] = frontendUrl;
			}
			console.log('Access-Control-Allow-Origin set for OPTIONS:', (preflightHeaders as Record<string, string>)['Access-Control-Allow-Origin']);

			return new Response(null, { status: 204, headers: preflightHeaders });
		}

		// Handle delete scout endpoint
		// Handle add scout endpoint
		if (url.pathname === '/api/scout-management/add-scout' && request.method === 'POST') {
			const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
				// const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
			try {
				const newScoutData = await request.json();
				console.log('Request body parsed:', newScoutData);
				const { email, user_metadata } = newScoutData;
				console.log('newScoutData:', newScoutData);
				console.log('user_metadata:', user_metadata);
				const { userrole, name, rank, crew } = user_metadata || {};
				console.log('Extracted userrole:', userrole);
				const full_name = name || email;

				console.log('Attempting to add scout with email:', email);

				// Proceed to create the user in Supabase Auth
				console.log('Proceeding to create user in Supabase Auth...');
					const { data: userResponse, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
						email: email,
						password: generateRandomPassword(),
						email_confirm: true,
						user_metadata: user_metadata,
					});

					if (createUserError) {
						console.error('Error creating user in Auth:', createUserError);
						if (createUserError.message.includes('User already registered')) {
							console.log('User already registered in Auth. Returning 409.');
							return handleCors(new Response(JSON.stringify({ error: 'A user with this email already exists in authentication.' }), { status: 409, headers: { 'Content-Type': 'application/json' } }));
						} else {
							console.log('Other error creating user in Auth. Returning 500.');
							return handleCors(new Response(JSON.stringify({ error: `Failed to create user: ${createUserError.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
						}
					}

					const userId = userResponse.user.id;
					console.log('User created in Auth with ID:', userId);

					// Insert the new scout into the 'scouts' table
					console.log('Attempting to insert scout into scouts table...');
					const { data: scoutInsertData, error: scoutInsertError } = await supabase
						.from('scouts')
						.insert([
							{
								user_id: userId,
								email: email,
								full_name: name,
								rank: rank,
								crew: crew,
							}
						]);

					if (scoutInsertError) {
						console.error('Error inserting scout into scouts table:', scoutInsertError);
						// Optionally, you might want to delete the user from auth if scout insertion fails
						return handleCors(new Response(JSON.stringify({ error: `Failed to add scout to database: ${scoutInsertError.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
					}
					console.log('Scout inserted into scouts table.');

					// Insert the user's role into the 'userroles' table
					console.log('Attempting to insert user role into userroles table for user_id:', userId, 'with role:', userrole);
					const { error: userRoleInsertError } = await supabase
						.from('userroles')
						.insert([
							{
								user_id: userId,
								userrole: userrole,
							}
						]);

					if (userRoleInsertError) {
						console.error('Error inserting user role into userroles table:', userRoleInsertError);
						return handleCors(new Response(JSON.stringify({ error: `Failed to assign user role: ${userRoleInsertError.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
					}
					console.log('User role inserted into userroles table successfully.');

					// Request Supabase to send a password reset email for the newly created user
					console.log('Attempting to request password reset email...');
					console.log('FRONTEND_URL used for redirectTo:', env.FRONTEND_URL);
					const cleanedFrontendUrl = env.FRONTEND_URL.endsWith('/') ? env.FRONTEND_URL.slice(0, -1) : env.FRONTEND_URL;
					console.log('Cleaned FRONTEND_URL for redirectTo:', cleanedFrontendUrl);
					// This comment is added to force a new deployment and clear cache.
					console.log('Inspecting supabaseAdmin object:', supabaseAdmin);
					console.log('Inspecting supabaseAdmin.auth object:', supabaseAdmin.auth);
					console.log('Inspecting supabaseAdmin.auth.admin object:', supabaseAdmin.auth.admin);
					const { data, error: generateLinkError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
						redirectTo: `${env.FRONTEND_URL}/update-password`,
					});

					if (generateLinkError) {
						console.error('Error sending password reset email:', JSON.stringify(generateLinkError));
						// Even if email sending fails, we proceed with scout creation, but log the error.
					} else {
						console.log('Password reset email requested from Supabase for user.');
					}

					response = handleCors(new Response(JSON.stringify({ message: 'Scout added successfully!' }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
				} catch (e: any) {
					console.error('Unhandled error in add-scout endpoint:', e);
					response = handleCors(new Response(JSON.stringify({ error: `Internal server error: ${e.message || e}` }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
				}
			} else if (url.pathname.startsWith('/api/scout-management/delete-scout/')) {
				const parts = url.pathname.split('/');
				const scoutId = parts[parts.length - 1];

				const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

				// First, get the user_id from the scouts table
				const { data: scoutData, error: fetchScoutError } = await supabase
					.from('scouts')
					.select('user_id')
					.eq('id', scoutId)
					.single();

					if (fetchScoutError) {
					console.error('Error fetching scout user_id:', fetchScoutError);
					response = handleCors(new Response(JSON.stringify({ error: fetchScoutError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
					return response;
				}

				const userId = scoutData.user_id;

				// Delete related scout_history entries first
				const { error: historyError } = await supabase
					.from('scout_history')
					.delete()
					.eq('scout_id', scoutId);

				if (historyError) {
					console.error('Error deleting scout history:', historyError);
					response = handleCors(new Response(JSON.stringify({ error: historyError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
				} else {
					// Then delete the scout from the 'scouts' table
					const { error: scoutError } = await supabase
						.from('scouts')
						.delete()
						.eq('id', scoutId);

					if (scoutError) {
						console.error('Error deleting scout:', scoutError);
						response = handleCors(new Response(JSON.stringify({ error: scoutError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
					} else {
						// Finally, delete the user from Supabase Auth
						const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

						if (deleteUserError) {
							console.error('Error deleting user from Supabase Auth:', deleteUserError);
							response = handleCors(new Response(JSON.stringify({ error: deleteUserError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
							console.log('Delete Scout Error Response (Auth Error):', response.headers.get('Access-Control-Allow-Origin'));
							return response;
						} else {
							response = new Response(JSON.stringify({ message: `Scout ${scoutId}, its history, and associated user deleted successfully!` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
							console.log('Delete Scout Success Response:', response.headers.get('Access-Control-Allow-Origin'));
						}
					}
				}
			} else if (url.pathname === '/api/auth/forgot-password' && request.method === 'POST') {
				try {
					const { email } = await request.json();
					console.log('Received forgot password request for email:', email);

					const cleanedFrontendUrl = env.FRONTEND_URL.endsWith('/') ? env.FRONTEND_URL.slice(0, -1) : env.FRONTEND_URL;
					const { error: generateLinkError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
						redirectTo: `${env.FRONTEND_URL}/update-password`,
					});

					if (generateLinkError) {
						console.error('Error sending password reset email via worker:', JSON.stringify(generateLinkError));
						response = handleCors(new Response(JSON.stringify({ error: generateLinkError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
					} else {
						console.log('Password reset email successfully requested via worker for:', email);
						response = handleCors(new Response(JSON.stringify({ message: 'Password reset email sent.' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
					}
				} catch (e: any) {
					console.error('Unhandled error in forgot-password endpoint:', e);
					response = handleCors(new Response(JSON.stringify({ error: `Internal server error: ${e.message || e}` }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
				}
			} else {
				switch (url.pathname) {
					case '/message':
						response = new Response('Hello, World!', { status: 200 });
						break;
					case '/random':
						response = new Response(crypto.randomUUID(), { status: 200 });
						break;
					default:
						response = new Response('Not Found', { status: 404 });
						break;
				}
			}

			return handleCors(response);
		},
	} satisfies ExportedHandler<Env>;
