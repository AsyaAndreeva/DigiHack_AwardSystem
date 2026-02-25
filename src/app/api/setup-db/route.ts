import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL environment variable is not set.' },
      { status: 500 }
    );
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Jury members table
    await sql`
      CREATE TABLE IF NOT EXISTS jury_members (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        passcode VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`ALTER TABLE jury_members ADD COLUMN IF NOT EXISTS passcode VARCHAR(20);`;

    // 2. Teams table
    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        passcode VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS passcode VARCHAR(20);`;

    // 3. Rubric categories and criteria
    await sql`
      CREATE TABLE IF NOT EXISTS rubric_criteria (
        id SERIAL PRIMARY KEY,
        category VARCHAR(512) NOT NULL,
        criterion VARCHAR(512) NOT NULL,
        max_score INTEGER NOT NULL DEFAULT 3,
        scoring_guide TEXT,
        order_idx INTEGER NOT NULL DEFAULT 0
      );
    `;

    // 4. Evaluations table
    await sql`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        jury_id VARCHAR(255),
        jury_name VARCHAR(255) NOT NULL,
        team_id VARCHAR(255) NOT NULL,
        team_name VARCHAR(255) NOT NULL,
        scores JSONB NOT NULL,
        total_score INTEGER NOT NULL,
        comments TEXT
      );
    `;

    // Migrate: add jury_id column if it doesn't exist (for databases created with old schema)
    await sql`
      ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS jury_id VARCHAR(255);
    `;

    // 5. Team profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS team_profiles (
        team_id VARCHAR(255) PRIMARY KEY,
        description TEXT,
        project_url VARCHAR(1024),
        presentation_url VARCHAR(1024),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 6. Seed rubric if empty
    const existing = await sql`SELECT COUNT(*) as c FROM rubric_criteria`;
    if (parseInt(existing[0].c) === 0) {
      const criteria = [
        // Category 1
        { category: '1. Иновация, Значимост и Приложимост', criterion: 'Дефиниране и Значимост', max_score: 3, order_idx: 0, scoring_guide: '3 т. Проблемът е ясно дефиниран, реално валидиран и напълно отговаря на казуса.\n2 т. Има реален проблем, но дефиницията е леко обща или не е напълно валидиран.\n1 т. „Решение, което си търси проблем" – казусът е измислен или тривиален.\n0 т. Липсва дефиниран проблем.' },
        { category: '1. Иновация, Значимост и Приложимост', criterion: 'Иновация и Конкурентно предимство', max_score: 4, order_idx: 1, scoring_guide: '4 т. Изцяло нов ъгъл/технология; ясно формулирано уникално предимство (UVP).\n3 т. Значително подобрение на съществуващо решение с добро UVP.\n2 т. Има лека иновация, но силно наподобява конкурентите.\n1 т. Базово решение, без реално предимство пред съществуващите на пазара.\n0 т. Директно копие / Липсва иновация.' },
        { category: '1. Иновация, Значимост и Приложимост', criterion: 'Реализуемост и Въздействие (Impact)', max_score: 3, order_idx: 2, scoring_guide: '3 т. Решението може да се внедри веднага/скоро и има огромен потенциал за позитивен мащаб.\n2 т. Може да се реализира, но изисква значително време/ресурс; среден мащаб на въздействие.\n1 т. Трудно реалистично в обозримо бъдеще; минимален импакт.\n0 т. Утопична идея, невъзможна за реализация.' },
        // Category 2
        { category: '2. Дизайн – Визуална идентичност & UI/UX', criterion: 'Цялост на бранда и UI', max_score: 4, order_idx: 3, scoring_guide: '4 т. Професионален, модерен дизайн; пълна консистентност (цветове, лого, шрифтове) навсякъде.\n3 т. Добра визия, но с леки разминавания между презентация и демо.\n1–2 т. Визуално разпиляно, прилича на базов шаблон (template) без характер.\n0 т. Липсва какъвто и да е дизайн/брандинг.' },
        { category: '2. Дизайн – Визуална идентичност & UI/UX', criterion: 'Потребителско преживяване (UX)', max_score: 4, order_idx: 4, scoring_guide: '4 т. Изключително интуитивно; нуждите се решават с минимален брой кликове/стъпки.\n3 т. Логично взаимодействие, но има нужда от лека оптимизация на потока (flow).\n1–2 т. Объркващо, потребителят се „губи" или има твърде много излишни стъпки.\n0 т. Неизползваем и нелогичен интерфейс.' },
        { category: '2. Дизайн – Визуална идентичност & UI/UX', criterion: 'Достъпност и Етика', max_score: 2, order_idx: 5, scoring_guide: '2 т. Отличен контраст, четимост, липса на манипулативни бутони (dark patterns).\n1 т. Дребни проблеми с четимостта или леко подвеждащи елементи.\n0 т. Нечетимо, несъобразено с потребителя или етично проблемно.' },
        // Category 3
        { category: '3. Техническо изпълнение и Архитектура', criterion: 'Функционалност и MVP', max_score: 4, order_idx: 6, scoring_guide: '4 т. Напълно работещо MVP (кликъбъл демо / написан код), което изпълнява основната функция.\n3 т. Демото работи частично; има някои бъгове, но основната логика е там.\n1–2 т. Само статични екрани (mockups) или код, който изобщо не се компилира/тръгва.\n0 т. Липсва каквото и да е демо или техническа разработка.' },
        { category: '3. Техническо изпълнение и Архитектура', criterion: 'Мащабируемост и Tech-Business Fit', max_score: 4, order_idx: 7, scoring_guide: '4 т. Отлична архитектура, готова за скалиране. Технологията пасва перфектно на бизнес плана.\n3 т. Добра архитектура, но ще изисква пренаписване при голям растеж.\n1–2 т. Избрана е грешна/тежка технология за този тип бизнес проблем; не може да скалира.\n0 т. Екипът не знае как работи решението им „под капака".' },
        { category: '3. Техническо изпълнение и Архитектура', criterion: 'Технически стек и Качество', max_score: 2, order_idx: 8, scoring_guide: '2 т. Добре структуриран код / Смислени интеграции на външни API или AI инструменти.\n1 т. Много базов код / Използване на API-та просто „за да ги има", без да носят стойност.\n0 т. Лош код / Липса на техническа обосновка.' },
        // Category 4
        { category: '4. Бизнес модел и Пазарна реализация', criterion: 'Пазарен анализ и Валидация', max_score: 3, order_idx: 9, scoring_guide: '3 т. Точно профилирана аудитория, ясни конкуренти, пазарната нужда е доказана с данни.\n2 т. Аудиторията е дефинирана, но само на теория; липсват конкретни данни/проучване.\n1 т. Много обща аудитория (напр. „всички хора"); подценяване на конкуренцията.\n0 т. Липсва пазарен анализ.' },
        { category: '4. Бизнес модел и Пазарна реализация', criterion: 'Go-to-Market стратегия', max_score: 2, order_idx: 10, scoring_guide: '2 т. Конкретен, бюджетно реалистичен и приложим план за първите 100/1000 клиенти.\n1 т. Повърхностен план (напр. „ще пуснем реклама във Facebook и ще чакаме").\n0 т. Липсва стратегия за достигане до пазара.' },
        { category: '4. Бизнес модел и Пазарна реализация', criterion: 'Монетизация и Финансов модел', max_score: 3, order_idx: 11, scoring_guide: '3 т. Логичен, ясен и финансово устойчив модел за приходи; реалистични цени.\n2 т. Има модел, но допусканията за приходи/разходи са прекалено оптимистични.\n1 т. Неясен или нереалистичен модел („ще събираме данни и ще ги продаваме").\n0 т. Екипът не знае как ще изкарва пари.' },
        { category: '4. Бизнес модел и Пазарна реализация', criterion: 'Бизнес мащабируемост', max_score: 2, order_idx: 12, scoring_guide: '2 т. Ясна визия за лесно навлизане на нови пазари/сегменти без започване от нулата.\n1 т. Бизнесът е локално заключен и би се мащабирал много трудно и скъпо.\n0 т. Няма визия за бъдещето отвъд хакатона.' },
        // Category 5
        { category: '5. Презентация, Убедителност и Защита', criterion: 'Storytelling и Яснота', max_score: 3, order_idx: 13, scoring_guide: '3 т. Грабна вниманието веднага. Завладяваща история от „болката" до решението, без жаргон.\n2 т. Ясно послание, но презентацията беше леко суха или монотонна.\n1 т. Объркващо обяснение, прекалено техническо, журито не разбра какво прави продуктът.\n0 т. Пълен хаос в изказа.' },
        { category: '5. Презентация, Убедителност и Защита', criterion: 'Структура и Време', max_score: 2, order_idx: 14, scoring_guide: '2 т. Балансирани слайдове (проблем, демо, бизнес); перфектно влизане във времето.\n1 т. Липсва ключов елемент (напр. бизнес модел) ИЛИ времето е леко просрочено.\n0 т. Грубо нарушаване на времето; липса на структура.' },
        { category: '5. Презентация, Убедителност и Защита', criterion: 'Екип и Сцена', max_score: 2, order_idx: 15, scoring_guide: '2 т. Екипът излъчва увереност, енергия и доказва защо точно те са хората за тази идея.\n1 т. Екипът е несигурен, липсва енергия или химия помежду им.\n0 т. Пълна липса на презентационни умения.' },
        { category: '5. Презентация, Убедителност и Защита', criterion: 'Защита и Q&A', max_score: 3, order_idx: 16, scoring_guide: '3 т. Точни, кратки отговори с факти. Приемат критиката професионално (coachable).\n2 т. Отговарят добре, но понякога заобикалят конкретиката или са леко дефанзивни.\n1 т. Губят се в общи приказки; реагират остро или обидено на критиката.\n0 т. Не могат да отговорят на нито един въпрос на журито.' },
      ];

      for (const c of criteria) {
        await sql`
          INSERT INTO rubric_criteria (category, criterion, max_score, scoring_guide, order_idx)
          VALUES (${c.category}, ${c.criterion}, ${c.max_score}, ${c.scoring_guide}, ${c.order_idx})
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Базата данни е инициализирана успешно.',
    });
  } catch (error: any) {
    console.error('Neon DB Setup Error:', error);
    return NextResponse.json(
      { error: 'Неуспешна инициализация на базата данни.', details: error.message },
      { status: 500 }
    );
  }
}
