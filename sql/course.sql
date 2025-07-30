CREATE OR REPLACE FUNCTION create_course_on_approval()
RETURNS TRIGGER AS $$
BEGIN

    IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
        
        IF NOT EXISTS (
            SELECT 1 FROM course WHERE request_id = NEW.request_id
        ) THEN
            INSERT INTO course (
                request_id, course_name, thumb_url, created_at,
                description, price, status
            )
            VALUES (
                NEW.request_id,
                NEW.course_name,
                NEW.img_url,
                NOW(),
                NEW.course_description,
                COALESCE(NEW.req_price, 0.00),
                'upcoming' 
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_course_on_approval
AFTER UPDATE OF status ON course_request
FOR EACH ROW
EXECUTE FUNCTION create_course_on_approval();
