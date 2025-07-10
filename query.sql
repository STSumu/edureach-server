//Enrollment

CREATE OR REPLACE FUNCTION insert_enrollments_on_payment_success()
RETURNS TRIGGER AS $$
BEGIN
    -- Only act if payment.status changed from 'pending' to 'successful'
    IF OLD.payment_status = 'pending' AND NEW.payment_status = 'successful' THEN
        INSERT INTO enrollment (course_id, student_id)
        SELECT oi.course_id, NEW.student_id
        FROM order_item oi
        WHERE oi.order_id = NEW.order_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER after_payment_success
AFTER UPDATE ON payment
FOR EACH ROW
WHEN (OLD.payment_status = 'pending' AND NEW.payment_status = 'successful')
EXECUTE FUNCTION insert_enrollments_on_payment_success();



//payment
CREATE OR REPLACE FUNCTION insert_payment_on_order_confirm()
RETURNS TRIGGER AS $$
DECLARE
    v_total_amount NUMERIC;
BEGIN
    -- Step 1: Calculate total amount from order_item
    SELECT SUM(price) INTO v_total_amount
    FROM order_item
    WHERE order_id = NEW.order_id;

    -- Step 2: Insert into payment table with all 4 values
    INSERT INTO payment (order_id, student_id, payment_method, amount)
    VALUES (NEW.order_id, NEW.student_id, NEW.payment_method, v_total_amount);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;





c
