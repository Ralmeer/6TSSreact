CREATE OR REPLACE FUNCTION create_scout_if_not_exists(
    p_user_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_rank TEXT,
    p_crew TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Check if a scout with the given user_id already exists
    IF EXISTS (SELECT 1 FROM public.scouts WHERE user_id = p_user_id) THEN
        -- If a scout with this user_id exists, update their details
        UPDATE public.scouts
        SET
            full_name = p_full_name,
            email = p_email,
            rank = p_rank,
            crew = p_crew
        WHERE user_id = p_user_id;
    ELSE
        -- If no scout with this user_id exists, check if a scout with the given email already exists
        IF EXISTS (SELECT 1 FROM public.scouts WHERE email = p_email) THEN
            -- If a scout with this email exists but not linked to the user_id, update it
            UPDATE public.scouts
            SET
                user_id = p_user_id,
                full_name = p_full_name,
                rank = p_rank,
                crew = p_crew
            WHERE email = p_email;
        ELSE
            -- If no scout with this user_id or email exists, insert a new scout
            INSERT INTO public.scouts (user_id, full_name, email, rank, crew)
            VALUES (p_user_id, p_full_name, p_email, p_rank, p_crew);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;