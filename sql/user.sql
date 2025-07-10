
CREATE OR REPLACE FUNCTION user_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO student(student_id) VALUES (NEW.user_id);
  ELSIF NEW.role = 'teacher' THEN
    INSERT INTO teacher(teacher_id) VALUES (NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/////////////////////////

CREATE TRIGGER user_after_insert
AFTER INSERT ON "user"
FOR EACH ROW
EXECUTE FUNCTION user_after_insert();