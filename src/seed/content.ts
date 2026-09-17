/**
 * Public copy of the academy, written from its two founding documents (10 June 2026):
 * «الورقة التأسيسية» and «دليل المؤسسات». Those papers were written for the group's
 * internal use; the text here says the same things to a visitor, in plain and
 * eloquent Arabic, shorter and to the point. English is a translation. Nothing is
 * invented — every fact, figure, and name comes from the papers; gaps stay in TODO.md.
 */
type L = { ar: string; en: string }
type LL = { ar: string[]; en: string[] }

/** Rich-text blocks the seed turns into Lexical. */
export type Block =
  { type: 'h'; text: string } | { type: 'p'; text: string } | { type: 'ul'; items: string[] }

// ── About page ──────────────────────────────────────────────────────────────

export const ABOUT_INTRO: Record<'ar' | 'en', Block[]> = {
  ar: [
    { type: 'h', text: 'من نحن' },
    {
      type: 'p',
      text: 'أكاديمية جيل الطوفان مؤسسة تربوية ومعرفية تتوجّه إلى الشباب العربي والمسلم أينما كانوا، لتُعدّهم لحمل القضية الفلسطينية بوعيٍ وعلمٍ وكفاءةٍ ومسؤولية. تقدّم الأكاديمية برامج تدريبية مباشرة عبر الإنترنت، تجمع بين أصالة الوعي التربوي وحداثة أدوات الفهم والتحليل والفعل: الثقافية منها والسياسية والإعلامية والميدانية.',
    },
    {
      type: 'p',
      text: 'وُلدت الأكاديمية من قناعة بأن لحظة طوفان الأقصى لحظة فارقة في تاريخ القضية الفلسطينية وتاريخ الأمة؛ لحظة أعادت تعريف حدود القوة، وشكّلت وعيًا جديدًا بطبيعة الصراع، ووضعت فلسطين في صدارة الاهتمام العالمي. وهذا الواقع الجديد يستدعي حواضن معرفية وتربوية منظّمة وعصرية، تعيد بناء الوعي الجمعي لشباب الأمة، وتصنع قوة فكرية ومقاومة ثقافية تواجه روايات الاحتلال المضلِّلة وتحديات الاستلاب الثقافي والسياسي.',
    },
    { type: 'h', text: 'منطلقاتنا' },
    {
      type: 'p',
      text: 'لا تنطلق الأكاديمية من ردّ فعل على الأحداث، بل من فلسفة تربوية ومعرفية تستلهم دلالات الطوفان ورهاناته:',
    },
    {
      type: 'ul',
      items: [
        'الإرادة تصنع الفارق: أثبت الطوفان أن التفوق المادي والعسكري والتكنولوجي قابل للانكسار أمام إرادة واعية ومنظّمة ومسؤولة؛ ولذلك نعمل على تحرير الشباب من عقدة النقص ومن الشعور بحتمية الهزيمة والتبعية.',
        'من الدفاع إلى المبادرة: نقلت هذه اللحظة القضية من مسار التفاوض العبثي إلى مسار الحسم؛ ولذلك ننتقل بالوعي الشبابي من عقلية تحسين شروط العيش تحت الاحتلال إلى عقلية الفعل الواعي والمنظّم في اتجاه التحرير الشامل.',
        'بديل معرفي وأخلاقي أصيل: كشف الطوفان ازدواجية المعايير في منظومة القيم الغربية وخطاب حقوق الإنسان والقانون الدولي؛ ولذلك نبني بديلًا معرفيًا وأخلاقيًا ينطلق من أصالة الأمة وحضارتها وإرثها الأخلاقي.',
        'قضية أمّة لا حدود لها: أعاد الطوفان ربط الأمة كلّها بفلسطين، وبيّن أن الحدود الحقيقية تُرسم في العقول قبل الخرائط؛ ولذلك نتجاوز الحدود الجغرافية والسياسية المصطنعة، ونجعل من كل شابّ عربي ومسلم شريكًا مباشرًا وفاعلًا في معركة التحرير.',
      ],
    },
  ],
  en: [
    { type: 'h', text: 'Who we are' },
    {
      type: 'p',
      text: 'Jeel Al-Toufan Academy is an educational institution for young Arabs and Muslims wherever they are, preparing them to carry the Palestinian cause with awareness, knowledge, competence, and responsibility. The Academy delivers live online training programs that join the authenticity of educational awareness with contemporary tools of understanding, analysis, and action: cultural, political, media, and field.',
    },
    {
      type: 'p',
      text: 'The Academy was born of the conviction that the Al-Aqsa Flood is a turning point in the history of the Palestinian cause and of the nation: a moment that redrew the boundaries of power, shaped a new awareness of the nature of the conflict, and placed Palestine at the forefront of global attention. This new reality calls for organised, contemporary spaces of knowledge and education that rebuild the collective awareness of the nation’s youth and build an intellectual strength and a cultural resistance able to confront the occupation’s misleading narratives and the challenges of cultural and political alienation.',
    },
    { type: 'h', text: 'Where we start from' },
    {
      type: 'p',
      text: 'The Academy is not a reaction to events. It rests on an educational philosophy drawn from the meanings and stakes of the Flood:',
    },
    {
      type: 'ul',
      items: [
        'Will makes the difference: the Flood proved that material, military, and technological superiority can be broken by a conscious, organised, responsible will. We therefore work to free young people from the inferiority complex and from the sense that defeat and dependence are inevitable.',
        'From defence to initiative: the moment moved the cause from futile negotiation to the path of resolution. We therefore move young people from a mindset of improving life under occupation to one of conscious, organised action towards comprehensive liberation.',
        'An authentic moral and intellectual alternative: the Flood exposed the double standards of the Western moral order and of the discourse of human rights and international law. We therefore build an alternative rooted in the nation’s authenticity, civilisation, and ethical heritage.',
        'A cause without borders: the Flood reconnected the whole nation with Palestine and showed that real borders are drawn in minds before maps. We therefore cross artificial geographic and political borders and make every young Arab and Muslim a direct, effective partner in the battle for liberation.',
      ],
    },
  ],
}

/** Three lines: a statement, the «quoted» official formulation, and the three pillars. */
export const VISION: L = {
  ar: 'تقوم رؤية الأكاديمية على الريادة في بناء جيل شبابي واعٍ فكريًا، متمكّن سياسيًا، مسؤول أخلاقيًا، ومستمسك بالحق الفلسطيني قضيةً مركزية للأمة.\n«أن تكون أكاديمية جيل الطوفان منصة رائدة في بناء جيل عربي ومسلم واعٍ بالقضية الفلسطينية، مؤهَّل معرفيًا وقياديًا، وقادر على صناعة الأثر.»\nثلاث ركائز نبني عليها هذا الجيل: العمق الفكري، والتوازن النفسي، والرؤية الاستراتيجية؛ لتكون المحصّلة إسهامًا فعليًا في التحرر والتحرير.',
  en: 'The Academy’s vision is leadership in building a generation of young people who are intellectually aware, politically capable, morally responsible, and committed to the Palestinian right as the nation’s central cause.\n“To be a leading platform in building an Arab and Muslim generation aware of the Palestinian cause, qualified in knowledge and leadership, and able to make an impact.”\nThree pillars carry this generation: intellectual depth, psychological balance, and strategic vision; together they add up to a real contribution to liberation.',
}

/** «القيم الحاكمة» — the three values the academy names. */
export const VALUES: { title: L; text: L }[] = [
  {
    title: { ar: 'الأصالة والوعي', en: 'Authenticity and awareness' },
    text: {
      ar: 'ارتباط راسخ بالجذور العقدية والتاريخية للفكر الإسلامي وللقضية الفلسطينية.',
      en: 'A firm rootedness in the creedal and historical foundations of Islamic thought and of the Palestinian cause.',
    },
  },
  {
    title: { ar: 'المهنية والأكاديمية', en: 'Professionalism and rigour' },
    text: {
      ar: 'محتوى علمي وتدريبي عالي الجودة، مبنيّ على منهج واضح لا على الارتجال.',
      en: 'High-quality academic and training content, built on a clear method rather than improvisation.',
    },
  },
  {
    title: { ar: 'الفاعلية والأثر', en: 'Effectiveness and impact' },
    text: {
      ar: 'تركيز على المخرجات العملية والمشاريع الميدانية؛ فالمعرفة التي لا تتحوّل إلى فعل لا تكتمل.',
      en: 'A focus on practical outcomes and field projects; knowledge that does not become action is incomplete.',
    },
  },
]

export const GOALS: LL = {
  ar: [
    'بناء الوعي السياسي وتفكيك السرديات الصهيونية: فهم عميق للصراع في أبعاده التاريخية والسياسية والقانونية، وقدرة على تفنيد الدعاية المضلِّلة.',
    'التزكية التربوية والروحية والنفسية: ترسيخ القيم الأخلاقية والصلابة النفسية وروح المبادرة والمسؤولية لدى الشباب.',
    'تطوير المهارات القيادية والعملية: التدريب على المناصرة الرقمية والميدانية، والدبلوماسية الشعبية، وصناعة المحتوى المؤثر.',
    'بناء شبكة معرفية عابرة للحدود: مجتمع شبابي مترابط يشكّل جبهة إسناد دائمة للقضية الفلسطينية، ونواةً للتحرير الشامل.',
    'إعادة قراءة التاريخ والواقع: قراءة قائمة على سنن التدافع والتحرير، لا على سرديات الاستسلام والواقعية السياسية المشوَّهة.',
    'تحويل المعرفة إلى أدوات فعل: نقل المعارف النظرية عن فلسطين إلى أدوات اشتباك معرفي وسياسي وإعلامي في الفضاءات المحلية والدولية.',
    'إعداد نخبة قيادية: جمع الطاقات الشبابية المتميزة في الأمة في بوتقة فكرية واحدة، تكون نواةً لقيادة العمل التحرري في مجتمعاتها.',
    'ترسيخ عقيدة الصمود والمقاومة: تأهيل الشباب لمواجهة الحرب النفسية وحملات تشويه الوعي ومحاولات التطبيع الفكري.',
  ],
  en: [
    'Building political awareness and dismantling Zionist narratives: a deep grasp of the conflict in its historical, political, and legal dimensions, and the ability to refute misleading propaganda.',
    'Educational, spiritual, and psychological formation: instilling moral values, resilience, initiative, and responsibility in young people.',
    'Developing leadership and practical skills: training in digital and field advocacy, popular diplomacy, and impactful content creation.',
    'Building a knowledge network across borders: a connected youth community that forms a permanent support front for the Palestinian cause and a nucleus for comprehensive liberation.',
    'Rereading history and the present: a reading built on the laws of struggle and liberation, not on narratives of surrender and distorted political realism.',
    'Turning knowledge into tools of action: carrying theoretical knowledge of Palestine into intellectual, political, and media engagement in local and international spaces.',
    'Forming a leadership elite: gathering the nation’s outstanding young talents into one intellectual crucible that becomes the nucleus for leading liberation work in their societies.',
    'Establishing a doctrine of steadfastness and resistance: preparing young people to face psychological warfare, campaigns that distort awareness, and attempts at intellectual normalisation.',
  ],
}

// ── Structure (دليل المؤسسات) ──────────────────────────────────────────────

export const STRUCTURE_INTRO: Record<'ar' | 'en', Block[]> = {
  ar: [
    {
      type: 'p',
      text: 'تُدار الأكاديمية بثلاث مرجعيات متكاملة: مجلس الرئاسة الذي يوجّه ويعتمد، ومجلس الإدارة الذي ينفّذ ويتابع، والمجلس العلمي الذي يراجع ويضمن الجودة.',
    },
    {
      type: 'p',
      text: 'ويقوم العمل في مؤسسات الأكاديمية كلّها، القيادية والعلمية والتنفيذية والإدارية، على مبدأ التطوّع: قيمة مؤسسية تجمع بين روح البذل وتحمّل المسؤولية ومهنية الأداء.',
    },
  ],
  en: [
    {
      type: 'p',
      text: 'Three complementary bodies run the Academy: the Presidency Council, which directs and approves; the Board of Directors, which executes and follows up; and the Scientific Council, which reviews and guarantees quality.',
    },
    {
      type: 'p',
      text: 'Work across all of the Academy’s institutions, leadership, academic, executive, and administrative, is voluntary: an institutional value that joins the spirit of giving and responsibility with professional performance.',
    },
  ],
}

type Member = { name: L; role: L }
export const STRUCTURE: {
  name: L
  kind: 'council' | 'team' | 'committee'
  description: L
  members: Member[]
}[] = [
  {
    name: { ar: 'مجلس الرئاسة', en: 'Presidency Council' },
    kind: 'council',
    description: {
      ar: 'أعلى مرجعية قيادية وإشرافية في الأكاديمية: يحدّد الرؤية والتوجهات الاستراتيجية، ويعتمد البرامج والمشاريع والشراكات، ويشرف على أداء الأكاديمية واستدامتها. يجتمع كل ثلاثة أشهر، وعند الحاجة.',
      en: 'The Academy’s highest leadership and oversight body: it sets the vision and strategic direction, approves programs, projects, and partnerships, and oversees the Academy’s performance and sustainability. It meets quarterly, and when needed.',
    },
    members: [
      {
        name: { ar: 'الأستاذ زياد بومخلة', en: 'Ziad Boumakhla' },
        role: { ar: 'رئيس الأكاديمية · تونس', en: 'President of the Academy · Tunisia' },
      },
    ],
  },
  {
    name: { ar: 'مجلس الإدارة', en: 'Board of Directors' },
    kind: 'council',
    description: {
      ar: 'الجهاز الإداري والتشغيلي الذي يحوّل قرارات مجلس الرئاسة وتوصيات المجلس العلمي إلى خطط وبرامج قابلة للتنفيذ والقياس. ثلاثة عشر عضوًا، لكل منهم ملف تنفيذي محدّد؛ يجتمع شهريًا.',
      en: 'The administrative and operational body that turns the Presidency Council’s decisions and the Scientific Council’s recommendations into executable, measurable plans and programs. Thirteen members, each with a defined executive portfolio; it meets monthly.',
    },
    members: [
      {
        name: { ar: 'محمد شنيبة', en: 'Mohamed Chniba' },
        role: { ar: 'المدير التنفيذي · تونس', en: 'Executive Director · Tunisia' },
      },
    ],
  },
  {
    name: { ar: 'المجلس العلمي', en: 'Scientific Council' },
    kind: 'council',
    description: {
      ar: 'المرجعية العلمية المستقلة المسؤولة عن جودة المحتوى والمناهج: يضع المعايير العلمية للبرامج ولاختيار المدرّبين، ويراجع المناهج والحقائب التدريبية ويعتمدها، ويشرف على الدراسات والأبحاث، ويعتمد معايير تقييم مشاريع التخرّج. يضم أكاديميين وباحثين وخبراء من تخصصات متنوعة، ويجتمع كل ثلاثة أشهر.',
      en: 'The independent academic authority responsible for the quality of content and curricula: it sets the academic standards for programs and for selecting trainers, reviews and approves curricula and training kits, supervises studies and research, and approves the assessment criteria for graduation projects. It brings together academics, researchers, and experts from varied fields, and meets quarterly.',
    },
    members: [],
  },
]

// ── Programs (مناهج التدريب) ────────────────────────────────────────────────

export const AUDIENCE: Record<'ar' | 'en', Block[]> = {
  ar: [
    {
      type: 'p',
      text: 'الشباب والشابات من العالم العربي والإسلامي ومن الجاليات المسلمة في الغرب، بين 18 و35 سنة: طلاب الجامعات، والخرّيجون الجدد، والشباب العامل.',
    },
  ],
  en: [
    {
      type: 'p',
      text: 'Young women and men from the Arab and Muslim world and from Muslim communities in the West, aged 18 to 35: university students, recent graduates, and young professionals.',
    },
  ],
}

/** The four competencies every directed program works towards. */
export const COMPETENCIES: LL = {
  ar: [
    'الكفاية القيمية والشخصية: الهوية، والمسؤولية، والانضباط، وأخلاقيات العمل.',
    'الكفاية المعرفية والتحليلية: التاريخ، والسياسة، والقانون الدولي، وتحليل السرديات، والتفكير النقدي.',
    'الكفاية القيادية والاجتماعية: القيادة، والتواصل، والعمل الجماعي، وإدارة الخلاف، وإدارة المبادرات.',
    'الكفاية الإعلامية والرقمية: التحقق من المعلومات، وصناعة المحتوى، والاتصال الاستراتيجي، والثقافة الرقمية.',
  ],
  en: [
    'Values and character: identity, responsibility, discipline, work ethics.',
    'Knowledge and analysis: history, politics, international law, narrative analysis, critical thinking.',
    'Leadership and social skills: leadership, communication, teamwork, conflict management, managing initiatives.',
    'Media and digital literacy: fact-checking, content creation, strategic communication, digital culture.',
  ],
}

export const REGISTRATION_NOTE: Record<'ar' | 'en', Block[]> = {
  ar: [
    {
      type: 'p',
      text: 'تُعقد البرامج الموجّهة الأربعة في الوقت نفسه، ويلتحق كل مشارك ببرنامج واحد فقط، بحسب اهتمامه وحاجته وتخصّصه.',
    },
    {
      type: 'ul',
      items: [
        'القبول: الدافع والرغبة في التعلّم، والقدرة على الالتزام، وحدّ أدنى من المهارات الرقمية، مع مراعاة التنوع الجغرافي والمهني. يُستكمل الطلب بمقابلة أو نموذج تحفيزي.',
        'الاستمرار: الحضور، والمشاركة، والجدية، وإنجاز التكليفات، والالتزام بميثاق المشاركة.',
        'التخرّج: نسبة حضور محددة، واجتياز التقييم، وإنجاز مشروع التخرّج وعرضه أمام لجنة، مع تقييم الفريق.',
      ],
    },
    {
      type: 'p',
      text: 'لا تعتمد الأكاديمية الاختبارات التقليدية؛ يتخرّج المشارك بمشروع اشتباك عملي (حملة إعلامية، أو بحث سياسي، أو مبادرة ميدانية) يُعرض في شهر سبتمبر من كل سنة.',
    },
  ],
  en: [
    {
      type: 'p',
      text: 'The four directed programs run at the same time, and each participant joins one program only, according to their interest, need, and background.',
    },
    {
      type: 'ul',
      items: [
        'Admission: motivation and willingness to learn, the ability to commit, basic digital skills, with attention to geographic and professional diversity. The application is completed with an interview or a motivation form.',
        'Continuation: attendance, participation, seriousness, completed assignments, and adherence to the code of conduct.',
        'Graduation: a set attendance rate, passing the assessment, completing the graduation project and presenting it to a panel, with a team evaluation.',
      ],
    },
    {
      type: 'p',
      text: 'The Academy does not rely on conventional exams; participants graduate with a practical engagement project (a media campaign, a political study, or a field initiative), presented in September each year.',
    },
  ],
}

export const PROGRAM_CONTENT: Record<
  string,
  {
    short: L
    intro: Record<'ar' | 'en', Block[]>
    duration: L
    goals?: LL
  }
> = {
  'open-training': {
    short: {
      ar: 'مسار مفتوح لكل من يريد أن يبدأ: ثماني محاضرات شهرية من أكتوبر إلى مايو، تنشر المعرفة الأساسية بالقضية في أوسع دائرة من شباب الأمة.',
      en: 'An open track for anyone who wants to begin: eight monthly lectures from October to May, spreading foundational knowledge of the cause among the widest circle of the nation’s youth.',
    },
    intro: {
      ar: [
        {
          type: 'p',
          text: 'يتوجّه التدريب المفتوح إلى أوسع دائرة من شباب الأمة، لينشر المعرفة الأساسية بالقضية الفلسطينية ويعزّز الوعي بواجب نصرة القدس وفلسطين، من خلال محاضرة شهرية من أكتوبر إلى مايو: ثماني محاضرات في الموسم.',
        },
        {
          type: 'p',
          text: 'يتجدّد المسار في كل موسم بمحتوى يواكب متطلبات المرحلة ومقتضيات الواقع، ويحمل كل موسم اسم شخصية قيادية ورمزية من تاريخ القضية الفلسطينية والأمة. شعاره: اكتشف وتعلّم.',
        },
      ],
      en: [
        {
          type: 'p',
          text: 'Open Training addresses the widest circle of the nation’s youth, spreading foundational knowledge of the Palestinian cause and strengthening awareness of the duty to support Al-Quds and Palestine, through one lecture a month from October to May: eight lectures a season.',
        },
        {
          type: 'p',
          text: 'The track is renewed every season with content that keeps pace with the moment, and each season carries the name of a leading, symbolic figure from the history of the Palestinian cause and the nation. Its motto: discover and learn.',
        },
      ],
    },
    duration: {
      ar: 'ثماني محاضرات، محاضرة واحدة شهريًا من أكتوبر إلى مايو',
      en: 'Eight lectures, one per month from October to May',
    },
  },
  'palestine-our-compass': {
    short: {
      ar: 'برنامج نظري لفهم جذور الصراع وواقع القضية الفلسطينية اليوم: التاريخ، والنظام الدولي، وبنية المنظومة الصهيونية.',
      en: 'A theoretical program on the roots of the conflict and the Palestinian cause today: history, the international order, and the structure of the Zionist system.',
    },
    intro: {
      ar: [
        {
          type: 'p',
          text: 'برنامج نظري غايته فهم أصل الصراع والواقع الراهن للقضية الفلسطينية.',
        },
        {
          type: 'p',
          text: 'يسير البرنامج في المسار المعرفي والسياسي على ثلاثة محاور: تاريخ فلسطين وفقه الصراع، من الجذور إلى طوفان الأقصى وتداعياته الاستراتيجية؛ والنظام الدولي والقضية الفلسطينية، من المؤسسات الدولية والقانون الدولي إلى المنظومة السياسية الحاكمة وموقع فلسطين منها؛ والمنظومة الصهيونية، بتفكيك بنية الكيان ونقاط قوته وضعفه، ومشاريع التطبيع وسبل مواجهتها ومقاومتها.',
        },
      ],
      en: [
        {
          type: 'p',
          text: 'A theoretical program whose aim is understanding the origin of the conflict and the current reality of the Palestinian cause.',
        },
        {
          type: 'p',
          text: 'It follows the knowledge and politics track along three axes: the history of Palestine and the anatomy of the conflict, from its roots to the Al-Aqsa Flood and its strategic consequences; the international order and the Palestinian cause, from international institutions and international law to the governing political system and Palestine’s place in it; and the Zionist system, dismantling the entity’s structure, its strengths and weaknesses, and normalisation projects and how to confront and resist them.',
        },
      ],
    },
    duration: {
      ar: 'ست حصص، حصة واحدة شهريًا من يناير إلى يونيو',
      en: 'Six sessions, one per month from January to June',
    },
  },
  'leaders-of-tomorrow': {
    short: {
      ar: 'برنامج نظري في صناعة الشخصية القيادية الرسالية: القيم، والصلابة النفسية، وأخلاقيات المدافعة والعمل الجماعي.',
      en: 'A theoretical program in forming the mission-driven leader: values, resilience, and the ethics of advocacy and teamwork.',
    },
    intro: {
      ar: [
        { type: 'p', text: 'برنامج نظري غايته صناعة الشخصية القيادية.' },
        {
          type: 'p',
          text: 'يسير البرنامج في المسار التربوي والقيمي على ثلاثة محاور: بناء الشخصية القيادية الرسالية، بقيم التضحية والصمود والمقاومة، والارتباط بالمسجد الأقصى والقدس مركزًا للهوية؛ والصلابة النفسية ومواجهة الإحباط، بأدوات التعامل مع الأزمات الإنسانية والسياسية وضمان استمرارية العمل الفكري والميداني؛ وأخلاقيات المدافعة والعمل الجماعي، بفقه العمل المؤسسي والتعاون بين مكوّنات الأمة المختلفة.',
        },
      ],
      en: [
        {
          type: 'p',
          text: 'A theoretical program whose aim is forming the leadership personality.',
        },
        {
          type: 'p',
          text: 'It follows the educational and values track along three axes: building the mission-driven leader, with the values of sacrifice, steadfastness, and resistance and attachment to Al-Aqsa and Al-Quds as the centre of identity; resilience and facing despair, with tools for handling human and political crises and sustaining intellectual and field work; and the ethics of advocacy and teamwork, with the practice of institutional work and cooperation among the nation’s components.',
        },
      ],
    },
    duration: {
      ar: 'ست حصص، حصة واحدة شهريًا من يناير إلى يونيو',
      en: 'Six sessions, one per month from January to June',
    },
  },
  'impact-makers': {
    short: {
      ar: 'برنامج تطبيقي في صناعة المحتوى الإعلامي والتأثير الرقمي: المناصرة الرقمية، والتحقق من المعلومات، والاتصال الاستراتيجي.',
      en: 'An applied program in media content creation and digital influence: digital advocacy, fact-checking, and strategic communication.',
    },
    intro: {
      ar: [
        { type: 'p', text: 'برنامج تطبيقي غايته صناعة المحتوى الإعلامي والتأثير الرقمي.' },
        {
          type: 'p',
          text: 'يدرّب البرنامج المشاركين على المناصرة الرقمية، والتحقق من المعلومات، وصناعة المحتوى المؤثر، والاتصال الاستراتيجي، ومتابعة المحتوى الرقمي المناصر لفلسطين على مختلف منصات التواصل الاجتماعي.',
        },
      ],
      en: [
        {
          type: 'p',
          text: 'An applied program whose aim is media content creation and digital influence.',
        },
        {
          type: 'p',
          text: 'It trains participants in digital advocacy, fact-checking, impactful content creation, strategic communication, and sustaining pro-Palestine digital content across social platforms.',
        },
      ],
    },
    duration: {
      ar: 'ست حصص، حصة واحدة شهريًا من يناير إلى يونيو',
      en: 'Six sessions, one per month from January to June',
    },
  },
  'community-pioneers': {
    short: {
      ar: 'برنامج تطبيقي في تصميم الحملات الميدانية وإدارة المبادرات المجتمعية: المناصرة الميدانية، والمقاطعة، وبناء النوادي والجمعيات.',
      en: 'An applied program in designing field campaigns and managing community initiatives: field advocacy, boycott, and founding clubs and associations.',
    },
    intro: {
      ar: [
        {
          type: 'p',
          text: 'برنامج تطبيقي غايته تصميم الحملات الميدانية وإدارة المبادرات المجتمعية.',
        },
        {
          type: 'p',
          text: 'يدرّب البرنامج المشاركين على المناصرة الميدانية والدبلوماسية الشعبية، وبناء حملات المقاطعة الاقتصادية والثقافية والسياسية المنظّمة، وتأسيس النوادي والجمعيات الشبابية في الجامعات والمجتمعات، وإطلاق مشاريع من أجل القدس وفلسطين.',
        },
      ],
      en: [
        {
          type: 'p',
          text: 'An applied program whose aim is designing field campaigns and managing community initiatives.',
        },
        {
          type: 'p',
          text: 'It trains participants in field advocacy and popular diplomacy, building organised economic, cultural, and political boycott campaigns, founding youth clubs and associations in universities and communities, and launching projects for Al-Quds and Palestine.',
        },
      ],
    },
    duration: {
      ar: 'ست حصص، حصة واحدة شهريًا من يناير إلى يونيو',
      en: 'Six sessions, one per month from January to June',
    },
  },
  'strategic-projects': {
    short: {
      ar: 'مشاريع نوعية ترافق المنظومة التدريبية، توسّع أثر الأكاديمية وتحوّل المعرفة إلى دور ومسؤولية.',
      en: 'Flagship projects alongside the training system, widening the Academy’s impact and turning knowledge into role and responsibility.',
    },
    intro: {
      ar: [
        {
          type: 'p',
          text: 'إلى جانب التربية والتكوين والبرامج التدريبية، تطلق الأكاديمية مشاريع استراتيجية تسهم بشكل مباشر في جهود التحرير الشامل: مشاريع نوعية ترافق المنظومة التربوية والتدريبية، وتوسّع أثر الأكاديمية، وتحوّل المعرفة إلى هوية ودور ومسؤولية.',
        },
        { type: 'p', text: '[تفاصيل كل مشروع تُنشر لاحقًا.]' },
      ],
      en: [
        {
          type: 'p',
          text: 'Alongside education, training, and the programs, the Academy launches strategic projects that contribute directly to the effort of comprehensive liberation: flagship projects that accompany the educational and training system, widen the Academy’s impact, and turn knowledge into identity, role, and responsibility.',
        },
        { type: 'p', text: '[Details of each project will be published later.]' },
      ],
    },
    duration: { ar: 'على مدار السنة', en: 'Year-round' },
  },
}

// ── Camp ────────────────────────────────────────────────────────────────────

export const CAMP = {
  summary: {
    ar: 'الخاتمة العملية لكل موسم: أسبوع كامل يُعقد في سبتمبر، بعد نهاية التكوين المفتوح والموجّه. [التواريخ والمكان مؤقتة]',
    en: 'The practical conclusion of every season: a full week held in September, after Open and Directed Training end. [Dates and location are placeholders]',
  },
  body: {
    ar: [
      {
        type: 'p',
        text: 'مخيمات جيل الطوفان هي تتويج الموسم التدريبي كلّه: خاتمة عملية تُعقد في شهر سبتمبر من كل سنة، بعد نهاية التكوين المفتوح والموجّه، فتربط منظومة الأكاديمية التربوية والتكوينية بعضها ببعض.',
      },
      {
        type: 'p',
        text: 'والمخيم مرحلة تجربة وتطبيق واندماج، لا رحلة ولا نشاط ترفيهي: فضاءات تفاعلية مباشرة تنقل المشاركين والمشاركات من التعلّم النظري إلى التجربة الجماعية والتطبيق العملي، على مدى أسبوع كامل يجمع المعرفة والحوار وبناء الشخصية والعمل الجماعي والمهارات، وإدارة المبادرات والمشاريع التحريرية.',
      },
    ] as Block[],
    en: [
      {
        type: 'p',
        text: 'The Jeel Al-Toufan camps crown the whole training season: a practical conclusion held each September, after Open and Directed Training end, binding the Academy’s educational and training system together.',
      },
      {
        type: 'p',
        text: 'The camp is a stage of experience, application, and integration, not a trip or a leisure activity: direct, interactive spaces that move participants from theoretical learning to collective experience and practical application, over a full week that brings together knowledge, dialogue, character building, teamwork, skills, and the management of initiatives and liberation projects.',
      },
    ] as Block[],
  },
}
