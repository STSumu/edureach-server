CREATE OR REPLACE FUNCTION get_material_count(enrollId INT)
RETURNS INT AS $$
DECLARE
  matCount INT := 0;
BEGIN
    SELECT COUNT(*) INTO matCount
    FROM mat_completion
    WHERE enroll_id = enrollId;

  RETURN matCount;
END;
$$ LANGUAGE plpgsql;

/////////////////////////////////////////////

CREATE OR REPLACE FUNCTION get_quiz_count(enrollId int)
RETURNS INT AS $$
DECLARE
  quizCount INT := 0;
BEGIN
    SELECT COUNT(*) INTO quizCount
    FROM quiz_attempt
    WHERE enroll_id = enrollId;
  RETURN quizCount;
END;
$$ LANGUAGE plpgsql;

//////////////////////////////////////////////

CREATE OR REPLACE FUNCTION get_progress_details(studentId INT,courseId int)
RETURNS TABLE (
  materials_completed INT,
  total_materials INT,
  quizzes_attempted INT,
  total_quizzes INT,
  quiz_average NUMERIC,
  progress NUMERIC
) AS $$
declare
   enrollId int;
   quizAvg numeric;
BEGIN
  SELECT enroll_id INTO enrollId
  FROM enrollment
  WHERE student_id = studentId AND course_id = courseId
  LIMIT 1;

  IF enrollId IS NULL THEN
    -- No enrollment found, return zeros
    RETURN QUERY SELECT 0, 0, 0, 0, 0::NUMERIC;
    RETURN;
  END IF;

 SELECT get_material_count(enrollId) INTO materials_completed;
  SELECT get_quiz_count(enrollId) INTO quizzes_attempted;

  select count(*) into total_materials from material where course_id=courseId;
  select count(*) into total_quizzes from quiz where course_id=courseId;

  SELECT COALESCE(AVG(qa.score * 100.0 / q.total_mark), 0)
  INTO quizAvg
  FROM quiz_attempt qa
  JOIN quiz q ON q.quiz_id = qa.quiz_id
  WHERE qa.enroll_id = enrollId;
  
   progress :=
    (CASE WHEN total_materials > 0 THEN (materials_completed::NUMERIC / total_materials) * 50 ELSE 0 END) +
    (quizAvg * 0.5);

  RETURN QUERY
  SELECT materials_completed, total_materials, quizzes_attempted, total_quizzes, quizAvg, progress;

END;
$$ LANGUAGE plpgsql;

/////////////////////////////////////////////////////////////////////////////

CREATE OR REPLACE FUNCTION trg_after_progress_update()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id int;
  v_course_id int;
  materials_completed int;
  total_materials int;
  quizzes_attempted int;
  total_quizzes int;
  quiz_average numeric;
  progress numeric;
BEGIN
  -- Get student and course from enroll_id
  SELECT student_id, course_id
  INTO v_student_id, v_course_id
  FROM enrollment
  WHERE enroll_id = NEW.enroll_id;

  IF NOT FOUND THEN
    RAISE WARNING 'Enrollment ID % not found in enrollment table', NEW.enroll_id;
    RETURN NEW;
  END IF;

  -- Get progress details
  SELECT
    g.materials_completed,
    g.total_materials,
    g.quizzes_attempted,
    g.total_quizzes,
    g.quiz_average,
    g.progress
  INTO
    materials_completed,
    total_materials,
    quizzes_attempted,
    total_quizzes,
    quiz_average,
    progress
  FROM get_progress_details(v_student_id, v_course_id) AS g;

  RAISE NOTICE 'Progress: Materials %/% , Quizzes %/%', materials_completed, total_materials, quizzes_attempted, total_quizzes;

  -- Only update if all materials and quizzes are completed
  IF materials_completed = total_materials AND quizzes_attempted = total_quizzes THEN
    UPDATE enrollment
    SET status = 'completed'
    WHERE student_id = v_student_id AND course_id = v_course_id;

    RAISE NOTICE 'Enrollment status updated to completed';
  ELSE
    RAISE NOTICE 'Not completed yet';
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in trg_after_progress_update: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



//////////////////////////////////////////////////////

CREATE TRIGGER trg_after_mat_completion
AFTER INSERT ON mat_completion
FOR EACH ROW
EXECUTE FUNCTION trg_after_progress_update();

CREATE TRIGGER trg_after_quiz_attempt
AFTER INSERT ON quiz_attempt
FOR EACH ROW
EXECUTE FUNCTION trg_after_progress_update();