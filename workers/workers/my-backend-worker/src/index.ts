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

		const origin = request.headers.get('Origin');
		const allowedMethods = 'GET, POST, PUT, DELETE, OPTIONS';
		const allowedHeaders = request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization';

		const handleCors = (response: Response) => {
			const corsHeaders: HeadersInit = {
				'Access-Control-Allow-Methods': allowedMethods,
				'Access-Control-Allow-Headers': allowedHeaders,
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Max-Age': '86400',
				'Vary': 'Origin',
			};

			(corsHeaders as Record<string, string>)['Access-Control-Allow-Origin'] = env.FRONTEND_URL || '*';

			for (const [key, value] of Object.entries(corsHeaders)) {
				response.headers.set(key, value);
			}
			return response;
		};

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			const preflightHeaders: HeadersInit = {
				'Access-Control-Allow-Origin': env.FRONTEND_URL || '*', // Allow all origins for preflight
				'Access-Control-Allow-Methods': allowedMethods,
				'Access-Control-Allow-Headers': allowedHeaders,
				'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
			};
			return new Response(null, { status: 204, headers: preflightHeaders });
		}

		// Handle delete scout endpoint
		// Handle add scout endpoint
		if (url.pathname === '/api/scout-management/add-scout' && request.method === 'POST') {
			const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
			try {
				const newScoutData = await request.json();
				const { email, user_metadata } = newScoutData;
				const { userrole, name, rank, crew } = user_metadata || {};
				const full_name = name || email;

				console.log('Attempting to add scout with email:', email);

				// Proceed to create the user in Supabase Auth
				console.log('Proceeding to create user in Supabase Auth...');
					const { data: userResponse, error: createUserError } = await supabase.auth.admin.createUser({
						email: email,
						password: generateRandomPassword(), // Assuming generateRandomPassword is defined elsewhere or will be added
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
							return handleCors(new Response(JSON.stringify({ error: createUserError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
						}
					}

					const userId = userResponse.user.id;
					console.log('User created in Auth with ID:', userId);

					// Generate a password reset link for the newly created user
					const { data: passwordResetLinkData, error: generateLinkError } = await supabase.auth.admin.generateLink({
						type: 'magiclink',
						email: email,
						options: {
							referenceId: userId,
							redirectTo: `${env.FRONTEND_URL}/complete-registration`,
						},
					});

					if (generateLinkError) {
						console.error('Error generating password reset link:', JSON.stringify(generateLinkError));
						// Even if link generation fails, we proceed with scout creation, but log the error.
					}

					// The magiclink type sends an email with the link directly from Supabase
					console.log('Password reset link generated and sent to user via email.');

					response = handleCors(new Response(JSON.stringify({ message: 'Scout added successfully!' }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
				} catch (e) {
					console.error('Error parsing request body or adding scout:', e);
					response = handleCors(new Response(JSON.stringify({ error: 'Invalid request body or internal server error' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
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
					return handleCors(response);
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
						const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

						if (deleteUserError) {
							console.error('Error deleting user from Supabase Auth:', deleteUserError);
							response = handleCors(new Response(JSON.stringify({ error: deleteUserError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
						} else {
							response = new Response(JSON.stringify({ message: `Scout ${scoutId}, its history, and associated user deleted successfully!` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
						}
					}
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
