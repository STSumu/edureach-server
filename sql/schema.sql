CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE thread_status AS ENUM ('open', 'closed');
CREATE TYPE user_type AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE course_status AS ENUM ('upcoming', 'running', 'completed');
CREATE TYPE std_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped');
CREATE TYPE material_type AS ENUM ('video', 'pdf', 'link', 'other');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE pay_meth AS ENUM ('card', 'online', 'bank');
CREATE TYPE pay_status AS ENUM ('pending', 'successful','failed');


CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    profile_pic TEXT,
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    password_hash TEXT NOT NULL,
    last_login_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role user_type DEFAULT 'student'
);

CREATE TABLE instructor (
    instructor_id INT PRIMARY KEY,
    expertise TEXT,
    FOREIGN KEY (instructor_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);


CREATE TABLE student (
    student_id INT PRIMARY KEY,
    level std_level DEFAULT 'beginner',
    interest TEXT,
    FOREIGN KEY (student_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE TABLE admin (
    admin_id INT PRIMARY KEY,
    FOREIGN KEY (admin_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE TABLE course (
    course_id SERIAL PRIMARY KEY,
    request_id int,
    course_name VARCHAR(255) NOT NULL,
    thumb_url TEXT,
    category TEXT,
    price NUMERIC(10,2) DEFAULT 0.00,        
    level std_level default 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    language VARCHAR(50),
    status course_status,
    duration VARCHAR(50),
    discount NUMERIC(10,3)
);


CREATE TABLE quiz (
    quiz_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    title TEXT NOT NULL,
    total_mark INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);
CREATE TABLE question (
    ques_id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL,
    quiz_text TEXT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id) ON DELETE CASCADE
);

CREATE TABLE option (
    option_id SERIAL PRIMARY KEY,
    question_id INT NOT NULL,
    option_txt TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES question(ques_id) ON DELETE CASCADE
);

CREATE TABLE enrollment (
    enroll_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status enrollment_status DEFAULT 'active',
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE
);


CREATE TABLE quiz_attempt (
    attempt_id SERIAL PRIMARY KEY,
    enroll_id INT NOT NULL,
    quiz_id INT NOT NULL,   
    answers JSONB,
    attempt_at TIMESTAMP NOT NULL,
    score NUMERIC,
    FOREIGN KEY (enroll_id) REFERENCES enrollment(enroll_id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id) ON DELETE CASCADE
);

CREATE TABLE material (
    material_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    title TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "order" INT,
    type material_type NOT NULL,
    url TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);


CREATE TABLE mat_completion (
    material_id INT NOT NULL,
    enroll_id INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (material_id, enroll_id),
    FOREIGN KEY (material_id) REFERENCES material(material_id) ON DELETE CASCADE,
    FOREIGN KEY (enroll_id) REFERENCES enrollment(enroll_id) ON DELETE CASCADE
);


CREATE TABLE wishlist (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);


CREATE TABLE course_request (
    request_id SERIAL PRIMARY KEY,
    admin_id INT,
    instructor_id INT NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    status request_status DEFAULT 'pending',
    start_date DATE,
    course_name VARCHAR(255) NOT NULL,
    course_description TEXT,
    intro_url TEXT,
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE SET NULL,
    FOREIGN KEY (instructor_id) REFERENCES instructor(instructor_id) ON DELETE CASCADE
);



CREATE TABLE ratings (
    ratings_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);



CREATE TABLE discussion_thread (
    thread_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    created_by INT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status thread_status DEFAULT 'open',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES "user"(user_id) ON DELETE CASCADE
);



CREATE TABLE discussion_post (
    post_id SERIAL PRIMARY KEY,
    thread_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_post_id INT,  -- New FK column for nested replies
    FOREIGN KEY (thread_id) REFERENCES discussion_thread(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_post_id) REFERENCES discussion_post(post_id) ON DELETE CASCADE
);
CREATE TABLE "order" (
    order_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    status order_status DEFAULT 'pending',
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE
);
CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    order_id INT NOT NULL,
    payment_method pay_meth default 'card',
    payment_status pay_status DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE CASCADE
);

CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE
);

CREATE TABLE cart_item (
    cart_id INT NOT NULL,
    course_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (cart_id, course_id),
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);

CREATE TABLE order_item (
    order_id INT NOT NULL,
    course_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (order_id, course_id),
    FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);