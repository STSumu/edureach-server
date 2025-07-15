CREATE OR REPLACE FUNCTION isLocked(current_matId INT, student_id INT)
RETURNS BOOLEAN AS $$
DECLARE
    enrollId INT;
    matOrder INT;
    courseId INT;
    prevMatId INT;
    isCompleted BOOLEAN;
BEGIN
    -- Try to get enrollment and material info
    BEGIN
        SELECT e.enroll_id, m."order", m.course_id
        INTO enrollId, matOrder, courseId
        FROM enrollment e
        JOIN material m ON e.course_id = m.course_id
        WHERE m.material_id =islocked.current_matId AND e.student_id =islocked.student_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- Not enrolled, so it's locked
            RETURN TRUE;
    END;

    -- First material is always unlocked
    IF matOrder = 1 THEN
        RETURN FALSE;
    END IF;

    -- Get previous material
    SELECT m.material_id
    INTO prevMatId
    FROM material m
    WHERE m."order" = matOrder - 1 AND m.course_id = courseId;

    -- Check if previous material was completed
    SELECT EXISTS (
        SELECT 1 FROM mat_completion mc
        WHERE mc.material_id = prevMatId AND mc.enroll_id = enrollId
    ) INTO isCompleted;

    -- Return true if not completed (locked), false otherwise
    RETURN NOT isCompleted;
END;
$$ LANGUAGE plpgsql;

select islocked(38,312)

/////////////////////////////////////////////////////

ALTER TABLE material ADD CONSTRAINT unique_course_order UNIQUE (course_id, "order");

////////////////////////////////////////////////////////////////////

CREATE OR REPLACE FUNCTION matComplete(student_id INT, mat_id INT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mat_completion (material_id, enroll_id, completed_at)
    SELECT material_id, e.enroll_id, NOW()
    FROM enrollment e
    JOIN material m ON e.course_id = m.course_id
    WHERE m.material_id = mat_id AND e.student_id = matComplete.student_id
    on conflict do nothing;
END;
$$ LANGUAGE plpgsql;


