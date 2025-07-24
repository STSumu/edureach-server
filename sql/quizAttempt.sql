create or replace function insertToQuizAttempt(studentId int,quizId int,answers jsonb,score NUMERIC)
RETURNS INT AS $$
declare 
   enrollId int;
   new_attempt_id INT;
begin 
   select e.enroll_id into enrollId 
   from enrollment e
   join quiz q on (q.course_id=e.course_id)
   where q.quiz_id=quizId and e.student_id=studentId
   LIMIT 1;

   IF enrollId IS NOT NULL THEN
        INSERT INTO quiz_attempt (enroll_id, quiz_id, answers, attempt_at, score)
        VALUES (enrollId, quizId, answers, NOW(), score)
        RETURNING attempt_id INTO new_attempt_id;

        RETURN new_attempt_id;
    ELSE
        RAISE NOTICE 'No enrollment found for student % in quiz %', studentId, quizId;
        RETURN NULL;
    END IF;

     SELECT attempt_id INTO new_attempt_id
  FROM quiz_attempt
  WHERE enroll_id = enrollId AND quiz_id = quizId
  LIMIT 1;

  IF new_attempt_id IS NOT NULL THEN
    RETURN new_attempt_id;
  END IF;
END;
$$ LANGUAGE plpgsql;