-- Function to add item to cart (returns serialized cart_id)
CREATE OR REPLACE FUNCTION add_to_cart(
    p_student_id INTEGER,
    p_course_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_cart_id INTEGER;
    v_course_price DECIMAL(10,2);
    v_item_exists INTEGER;
BEGIN
    -- Get or create cart for student (cart_id is auto-generated)
    v_cart_id := get_or_create_cart(p_student_id);
    
    -- Verify course exists and get price
    SELECT price INTO v_course_price 
    FROM course 
    WHERE course_id = p_course_id;
    
    IF v_course_price IS NULL THEN
        RAISE EXCEPTION 'Course with id % not found', p_course_id;
    END IF;
    
    -- Check if item already in cart
    SELECT COUNT(*) INTO v_item_exists 
    FROM cart_item 
    WHERE cart_id = v_cart_id 
    AND course_id = p_course_id;
    
    IF v_item_exists > 0 THEN
        RAISE EXCEPTION 'Course % already in cart for student %', p_course_id, p_student_id;
    END IF;
    
    -- Insert into cart_item (trigger will also validate)
    INSERT INTO cart_item (cart_id, course_id, price) 
    VALUES (v_cart_id, p_course_id, v_course_price);
    
    -- Return the cart_id
    RETURN v_cart_id;
END;
$$ LANGUAGE plpgsql;

/////////////////////////////////////////////////////////////////////////////////

CREATE OR REPLACE FUNCTION get_or_create_cart(p_student_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_cart_id INTEGER;
BEGIN
    -- Try to get existing cart for the student
    SELECT cart_id INTO v_cart_id 
    FROM cart 
    WHERE student_id = p_student_id 
    LIMIT 1;
    
    -- If no cart exists, create one with auto-generated cart_id
    IF v_cart_id IS NULL THEN
        INSERT INTO cart (student_id, updated_at) 
        VALUES (p_student_id, NOW())
        RETURNING cart_id INTO v_cart_id;
    END IF;
    
    RETURN v_cart_id;
END;
$$ LANGUAGE plpgsql;

///////////////////////////////////////////////////////////////////////////////////////////////

CREATE TRIGGER cart_item_before_insert_2
    BEFORE INSERT ON cart_item
    FOR EACH ROW
    EXECUTE FUNCTION cart_item_trigger_function();

///////////////////////////////////////////////////////////////////////////////////////


CREATE OR REPLACE FUNCTION cart_item_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id INTEGER;
    v_course_price DECIMAL(10,2);
    v_item_exists INTEGER;
BEGIN
    -- student_id from cart table
    SELECT student_id INTO v_student_id 
    FROM cart 
    WHERE cart_id = NEW.cart_id;
    
    -- Check if cart exists
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Invalid cart_id: %', NEW.cart_id;
    END IF;
    
    -- current price from course table
    SELECT price INTO v_course_price 
    FROM course 
    WHERE course_id = NEW.course_id;
    
    -- check if course exists
    IF v_course_price IS NULL THEN
        RAISE EXCEPTION 'Invalid course_id: %', NEW.course_id;
    END IF;
    
    -- Check for duplicate items in cart
    SELECT COUNT(*) INTO v_item_exists 
    FROM cart_item 
    WHERE cart_id = NEW.cart_id 
    AND course_id = NEW.course_id;
    
    IF v_item_exists > 0 THEN
        RAISE EXCEPTION 'Course % already exists in cart %', NEW.course_id, NEW.cart_id;
    END IF;
    
    -- Auto-set the price from course table
    NEW.price := v_course_price;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

////////////////////////////////////////////////////////////////////////////////////////////


-- Function to remove item from cart
CREATE OR REPLACE FUNCTION remove_from_cart(
    p_student_id INTEGER,
    p_course_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_cart_id INTEGER;
    v_deleted_count INTEGER;
BEGIN
    -- Get cart for student
    SELECT cart_id INTO v_cart_id 
    FROM cart 
    WHERE student_id = p_student_id;
    
    IF v_cart_id IS NULL THEN
        RETURN FALSE; -- No cart found
    END IF;
    
    -- Delete the item
    DELETE FROM cart_item 
    WHERE cart_id = v_cart_id 
    AND course_id = p_course_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

//////////////////////////////////////////////////////////////////////////

CREATE OR REPLACE FUNCTION get_cart_contents(p_student_id INT)
RETURNS TABLE (
    cart_id INT,
    course_id INT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.cart_id,
        ci.course_id
    FROM cart_item ci
    JOIN cart ct ON ci.cart_id = ct.cart_id
    JOIN course c ON ci.course_id = c.course_id
    WHERE ct.student_id = p_student_id
    ORDER BY ci.cart_id, ci.course_id;
END;
$$ LANGUAGE plpgsql;

////////////////////////////////////////////////////////////////////////////



CREATE OR REPLACE FUNCTION get_cart_total(p_student_id INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(ci.price), 0) INTO v_total
    FROM cart_item ci
    JOIN cart ct ON ci.cart_id = ct.cart_id
    WHERE ct.student_id = p_student_id;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;


-- Function to clear cart for a student
CREATE OR REPLACE FUNCTION clear_cart(p_student_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_cart_id INTEGER;
BEGIN
    -- Get cart for student
    SELECT cart_id INTO v_cart_id 
    FROM cart 
    WHERE student_id = p_student_id;
    
    IF v_cart_id IS NULL THEN
        RETURN FALSE; -- No cart found
    END IF;
    
    -- Delete all items from cart
    DELETE FROM cart_item WHERE cart_id = v_cart_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;