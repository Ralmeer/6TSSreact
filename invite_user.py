import os
import random
import string
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not SUPABASE_ANON_KEY:
    raise ValueError("Supabase URL, Service Role Key, and Anon Key must be set in .env file")

supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def generate_random_password(length=6):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for i in range(length))

def invite_user_and_set_role(email, is_leader=False, full_name="", rank="", user_role="", crew=""):
    try:
        # Generate a random 6-digit password
        random_password = generate_random_password()

        # Create the user with the random password using the admin client
        create_response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": random_password,
            "email_confirm": False, # Do not send confirmation email
            "user_metadata": {
                "is_leader": is_leader,
                "full_name": full_name,
                "rank": rank,
                "user_role": user_role,
                "crew": crew
            }
        })

        print(f"User created: {email}")
        print(f"User metadata set: {create_response.user.user_metadata}")

        # Send a password reset email to the user
        reset_password_response = supabase_admin.auth.reset_password_for_email(email)
        print(f"Password reset email sent to: {email}")
        print(f"Password reset response: {reset_password_response}")

        # Check if user role already exists
        existing_role = supabase_admin.from_('userroles').select('*').eq('user_id', create_response.user.id).execute()

        if existing_role.data:
            # Update existing role
            role_response = supabase_admin.from_('userroles').update({'userrole': user_role}).eq('user_id', create_response.user.id).execute()
            print(f"User role updated: {role_response}")
        else:
            # Insert new role
            role_data = {"user_id": create_response.user.id, "userrole": user_role}
            role_response = supabase_admin.from_('userroles').insert([role_data]).execute()
            print(f"User role inserted: {role_response}")

        # Insert into public.scouts table
        if user_role == 'scout':
            scout_data = {
                "user_id": create_response.user.id,
                "full_name": full_name,
                "rank": 'Recruit',  # Default rank for new scouts
                "crew": crew
            }
            scout_response = supabase_admin.from_('scouts').insert([scout_data]).execute()
            print(f"Scout data inserted: {scout_response}")

    except Exception as e:
        print(f"Error in user creation or password update: {e}")

import uuid

if __name__ == "__main__":
    unique_id = uuid.uuid4().hex[:8]
    user_email = f"john.soe_{unique_id}@example.com"
    invite_user_and_set_role(user_email, is_leader=False, full_name="John Soe", rank="recruit", user_role="scout", crew="Terns")