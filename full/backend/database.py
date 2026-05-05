import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "albahadi.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gender TEXT DEFAULT 'male',
        birth_year INTEGER,
        death_year INTEGER,
        birth_place TEXT,
        country TEXT DEFAULT 'السعودية',
        bio TEXT,
        role TEXT,
        achievements TEXT,
        photo_url TEXT,
        generation INTEGER DEFAULT 0,
        is_deceased BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'published',
        image_url TEXT,
        branch TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'admin',
        branch TEXT
    );

    CREATE TABLE IF NOT EXISTS relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER,
        child_id INTEGER,
        rel_type TEXT DEFAULT 'blood',
        FOREIGN KEY(parent_id) REFERENCES members(id),
        FOREIGN KEY(child_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        event_type TEXT,
        event_date DATE,
        member_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS timeline_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        year INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS spouse_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person1_id INTEGER,
        person2_id INTEGER,
        FOREIGN KEY(person1_id) REFERENCES members(id),
        FOREIGN KEY(person2_id) REFERENCES members(id)
    );
    """)

    # Default Super Admin
    cur.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', '7122672000', 'super_admin')")

    # Insert sample data only if empty
    count = cur.execute("SELECT COUNT(*) FROM members").fetchone()[0]
    if count == 0:
        _insert_sample_data(cur)

    conn.commit()
    conn.close()

def _insert_sample_data(cur):
    members = [
        # (id, name, gender, birth_year, death_year, birth_place, country, bio, role, achievements, generation, is_deceased)
        (1, "عبدالله بن سالم الباهادي", "male", 1880, 1960, "نجد", "السعودية", "مؤسس القبيلة وشيخها الأول.", "شيخ القبيلة", "أسّس قبيلة الباهادي", 0, 1),
        (2, "محمد بن عبدالله الباهادي", "male", 1910, 1985, "الرياض", "السعودية", "أكبر أبناء الشيخ عبدالله.", "شيخ القبيلة", "تولى مشيخة القبيلة", 1, 1),
        (3, "علي بن عبدالله الباهادي", "male", 1915, 1990, "الرياض", "السعودية", "العالم والفقيه في القبيلة.", "عالم دين", "درس وتعلّم وأفاد أبناء قبيلته", 1, 1),
        (4, "حسن بن عبدالله الباهادي", "male", 1920, 2000, "جدة", "السعودية", "رجل الأعمال الأول في القبيلة.", "رجل أعمال", "أسّس أول شركة تجارية", 1, 1),
        (5, "مريم بنت عبدالله الباهادي", "female", 1918, 2005, "الرياض", "السعودية", "ربة البيت الكريمة.", "سيدة بيت", "رعايتها للأسرة الكبيرة", 1, 1),
        (6, "سالم بن محمد الباهادي", "male", 1938, None, "الرياض", "السعودية", "رجل دولة بارز.", "دبلوماسي", "خدم المملكة دبلوماسياً", 2, 0),
        (7, "أحمد بن محمد الباهادي", "male", 1942, None, "الرياض", "الإمارات", "مهندس متميز.", "مهندس", "بنى جسراً بين الفروع", 2, 0),
        (8, "نورة بنت محمد الباهادي", "female", 1945, None, "الرياض", "السعودية", "معلمة فاضلة.", "معلمة", "خدمة التعليم", 2, 0),
        (9, "عمر بن علي الباهادي", "male", 1945, None, "مكة المكرمة", "السعودية", "طبيب متخصص في القلب.", "طبيب قلب", "عمليات قلب مفتوح", 2, 0),
        (10, "فاطمة بنت علي الباهادي", "female", 1948, None, "مكة المكرمة", "المملكة المتحدة", "أكاديمية متميزة.", "أكاديمية", "دكتوراه من أكسفورد", 2, 0),
        (11, "يوسف بن حسن الباهادي", "male", 1950, None, "جدة", "الكويت", "رجل أعمال ناجح.", "رجل أعمال", "مجموعة شركات الباهادي", 2, 0),
        (12, "زينب بنت حسن الباهادي", "female", 1953, None, "جدة", "السعودية", "ناشطة اجتماعية.", "ناشطة اجتماعية", "ربط أبناء القبيلة", 2, 0),
        (13, "عبدالله بن سالم الباهادي", "male", 1965, None, "الرياض", "السعودية", "محامٍ بارز.", "محامي", "مستشار قانوني", 3, 0),
        (14, "منيرة بنت سالم الباهادي", "female", 1968, None, "الرياض", "فرنسا", "مصممة أزياء.", "مصممة أزياء", "الموضة العالمية", 3, 0),
        (15, "خالد بن أحمد الباهادي", "male", 1970, None, "دبي", "الإمارات", "مدير تنفيذي.", "مدير تنفيذي", "مشاريع تقنية", 3, 0),
        (16, "محمد بن عمر الباهادي", "male", 1972, None, "الرياض", "السعودية", "طبيب أطفال.", "طبيب أطفال", "عيادة متخصصة", 3, 0),
        (17, "سارة بنت عمر الباهادي", "female", 1975, None, "الرياض", "كندا", "باحثة ذكاء اصطناعي.", "باحثة ذكاء اصطناعي", "أبحاث علمية", 3, 0),
        (18, "سلطان بن يوسف الباهادي", "male", 1978, None, "الكويت", "الكويت", "رجل أعمال شاب.", "رجل أعمال", "توسع خليجي", 3, 0),
        (19, "ريم بنت عبدالله الباهادي", "female", 2000, None, "الرياض", "السعودية", "طالبة طب.", "طالبة", "منحة دراسية", 4, 0),
        (20, "فهد بن عبدالله الباهادي", "male", 2003, None, "الرياض", "السعودية", "طالب ثانوي موهوب.", "طالب", "أولمبياد الروبوتيك", 4, 0),
    ]

    cur.executemany("""
        INSERT INTO members (id, name, gender, birth_year, death_year, birth_place, country, bio, role, achievements, generation, is_deceased)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, members)

    # Relationships
    relationships = [(1,2),(1,3),(1,4),(1,5),(2,6),(2,7),(2,8),(3,9),(3,10),(4,11),(4,12),(6,13),(6,14),(7,15),(9,16),(9,17),(11,18),(13,19),(13,20)]
    cur.executemany("INSERT INTO relationships (parent_id, child_id) VALUES (?,?)", relationships)
