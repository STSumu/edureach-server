CREATE OR REPLACE FUNCTION createQuiz(
  p_course_id INTEGER,
  p_title TEXT,
  p_questions JSON
)
RETURNS INTEGER AS $$
DECLARE
  q_id INTEGER;
  o_id INTEGER;
  new_quiz_id INTEGER;
  ques JSON;
  opt TEXT;
  i INTEGER;
BEGIN

  INSERT INTO quiz (course_id, title)
  VALUES (p_course_id, p_title)
  RETURNING quiz_id INTO new_quiz_id;

  FOR i IN 0 .. json_array_length(p_questions) - 1 LOOP
    ques := p_questions -> i;

    INSERT INTO question (quiz_id, quiz_text)
    VALUES (
      new_quiz_id,
      ques ->> 'question'
    )
    RETURNING ques_id INTO q_id;

    FOR o_id IN 0 .. json_array_length(ques -> 'options') - 1 LOOP
      opt := (ques -> 'options') ->> o_id;

      INSERT INTO "option" (ques_id, option_txt, is_correct)
      VALUES (
        q_id,
        opt,
        (o_id = (ques ->> 'correctAnswer')::int)
      );
    END LOOP;

  END LOOP;

  RETURN new_quiz_id;
END;
$$ LANGUAGE plpgsql;
