//order_item
create or replace function add_to_order(p_student_id INTEGER, p_course_id INTEGER) RETURNS INTEGER as $$
DECLARE
    v_order_id INTEGER;
    v_course_price DECIMAL(10,2);
    v_item_exists INTEGER;
BEGIN
    -- get or create order for student (order_id is auto-generated)
    v_order_id := get_or_create_order(p_student_id);
    
    -- verify course exists and get price
    SELECT price INTO v_course_price 
    FROM course 
    WHERE course_id = p_course_id;
    
    IF v_course_price IS NULL THEN
        RAISE EXCEPTION 'Course with id % not found', p_course_id;
    END IF;
    
    -- Check if item already in order
    SELECT COUNT(*) INTO v_item_exists 
    FROM order_item 
    WHERE order_id = v_order_id 
    AND course_id = p_course_id;
    
    IF v_item_exists > 0 THEN
        RAISE EXCEPTION 'Course % already in order for student %', p_course_id, p_student_id;
    END IF;
    
    -- Insert into order_item (trigger will also validate and set price)
    INSERT INTO order_item (order_id, course_id, price) 
    VALUES (v_order_id, p_course_id, v_course_price);
    
    -- Return the order_id
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

////////////////////////////////////////////////////////////////////////////////////////////////////

CREATE OR REPLACE FUNCTION get_or_create_order(p_student_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_order_id INTEGER;
BEGIN
    -- Try to get existing pending order for the student
    SELECT order_id INTO v_order_id 
    FROM "order" 
    WHERE student_id = p_student_id 
    AND status = 'pending'
    LIMIT 1;

    -- If no pending order exists, create one
    IF v_order_id IS NULL THEN
        INSERT INTO "order" (student_id, status, ordered_at, payment_method) 
        VALUES (p_student_id, 'pending', NOW(), 'online')
        RETURNING order_id INTO v_order_id;
    END IF;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;


////////////////////////////////////////////////////////////////////////////////////////////

create trigger order_item_before_insert_2 
BEFORE INSERT on order_item
for EACH row
execute FUNCTION order_item_trigger_function ();

////////////////////////////////////////////////////////////////////////////////////////////

create or replace function order_item_trigger_function () RETURNS TRIGGER as $$
DECLARE
    v_student_id INTEGER;
    v_course_price DECIMAL(10,2);
    v_item_exists INTEGER;
BEGIN
    -- Get student_id from order table
    SELECT student_id INTO v_student_id 
    FROM "order" 
    WHERE order_id = NEW.order_id;
    
    -- Check if order exists
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Invalid order_id: %', NEW.order_id;
    END IF;
    
    -- Get current price from course table
    SELECT price INTO v_course_price 
    FROM course 
    WHERE course_id = NEW.course_id;
    
    -- Check if course exists
    IF v_course_price IS NULL THEN
        RAISE EXCEPTION 'Invalid course_id: %', NEW.course_id;
    END IF;
    
    -- Check for duplicate items in order
    SELECT COUNT(*) INTO v_item_exists 
    FROM order_item 
    WHERE order_id = NEW.order_id 
    AND course_id = NEW.course_id;
    
    IF v_item_exists > 0 THEN
        RAISE EXCEPTION 'Course % already exists in order %', NEW.course_id, NEW.order_id;
    END IF;
    
    -- Auto-set the price from course table
    NEW.price := v_course_price;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;





-- DROP TRIGGER order_item_before_insert ON order_item;



create or replace function remove_from_order (p_student_id INTEGER, p_course_id INTEGER) RETURNS BOOLEAN as $$
DECLARE
    v_order_id INTEGER;
    v_deleted_count INTEGER;
BEGIN
    -- get pending order for student
    SELECT order_id INTO v_order_id 
    FROM "order" 
    WHERE student_id = p_student_id 
    AND status = 'pending';
    
    IF v_order_id IS NULL THEN
        RETURN FALSE; -- No pending order found
    END IF;
    
    -- Delete the item
    DELETE FROM order_item 
    WHERE order_id = v_order_id 
    AND course_id = p_course_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_order_contents(
  p_student_id INTEGER,
)
RETURNS TABLE (
  order_id INTEGER,
  course_id INTEGER,
  course_name VARCHAR,
  price DECIMAL(10, 2),
  status order_status,
  ordered_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.order_id,
    oi.course_id,
    c.course_name,
    oi.price,
    o.status,
    o.ordered_at
  FROM order_item oi
  JOIN "order" o ON oi.order_id = o.order_id
  JOIN course c ON oi.course_id = c.course_id
  WHERE o.student_id = p_student_id
  ORDER BY o.ordered_at DESC, oi.course_id;
END;
$$ LANGUAGE plpgsql;



create or replace function get_order_total(
  p_student_id INTEGER,
  p_status order_status default 'pending'
) RETURNS DECIMAL(10, 2) as $$
DECLARE
    v_total DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(oi.price), 0) INTO v_total
    FROM order_item oi
    JOIN "order" o ON oi.order_id = o.order_id
    WHERE o.student_id = p_student_id 
    AND o.status = p_status;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

create or replace function confirm_order(
  p_student_id INTEGER,
  p_payment_method pay_meth default 'online'
) RETURNS INTEGER as $$
DECLARE
    v_order_id INTEGER;
    v_item_count INTEGER;
BEGIN
    -- Get pending order for student
    SELECT order_id INTO v_order_id 
    FROM "order" 
    WHERE student_id = p_student_id 
    AND status = 'pending';
    
    IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'No pending order found for student %', p_student_id;
    END IF;
    
    -- Check if order has items
    SELECT COUNT(*) INTO v_item_count 
    FROM order_item 
    WHERE order_id = v_order_id;
    
    IF v_item_count = 0 THEN
        RAISE EXCEPTION 'Cannot confirm empty order %', v_order_id;
    END IF;
    
    -- Update order status and payment method
    UPDATE "order" 
    SET status = 'confirmed', 
        payment_method = p_payment_method,
        ordered_at = NOW()
    WHERE order_id = v_order_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;


create or replace function cancel_order(p_student_id INTEGER) RETURNS BOOLEAN as $$
DECLARE
    v_order_id INTEGER;
BEGIN
    -- Get pending order for student
    SELECT order_id INTO v_order_id 
    FROM "order" 
    WHERE student_id = p_student_id 
    AND status = 'pending';
    
    IF v_order_id IS NULL THEN
        RETURN FALSE; -- No pending order found
    END IF;
    
    -- Update order status to cancelled
    UPDATE "order" 
    SET status = 'cancelled' 
    WHERE order_id = v_order_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

create or replace function clear_pending_order (p_student_id INTEGER) RETURNS BOOLEAN as $$
DECLARE
    v_order_id INTEGER;
BEGIN
    -- Get pending order for student
    SELECT order_id INTO v_order_id 
    FROM "order" 
    WHERE student_id = p_student_id 
    AND status = 'pending';
    
    IF v_order_id IS NULL THEN
        RETURN FALSE; -- No pending order found
    END IF;
    
    -- Delete all items from pending order
    DELETE FROM order_item WHERE order_id = v_order_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION peek_next_order_id()
RETURNS INTEGER AS $$
DECLARE
    v_next_id INTEGER;
BEGIN
    SELECT MAX(order_id) + 1 INTO v_next_id FROM "order";
    IF v_next_id IS NULL THEN
        RETURN 1; -- First order ever
    END IF;
    RETURN v_next_id;
END;
$$ LANGUAGE plpgsql;


SELECT column_default
FROM information_schema.columns
WHERE table_name = 'order'
AND column_name = 'order_id';

SELECT setval(
  'order_order_id_seq',
  COALESCE((SELECT MAX(order_id) FROM "order"), 0) + 1,
  false
);