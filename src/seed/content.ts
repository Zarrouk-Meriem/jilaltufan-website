/**
 * Content extracted from the academy's two founding documents (10 June 2026):
 * «الورقة التأسيسية» and «دليل المؤسسات». Arabic is verbatim or lightly tightened;
 * English is a translation. Nothing here is invented — gaps stay marked in TODO.md.
 */
type L = { ar: string; en: string }
type LL = { ar: string[]; en: string[] }

/** Rich-text blocks the seed turns into Lexical. */
export type Block =
  { type: 'h'; text: string } | { type: 'p'; text: string } | { type: 'ul'; items: string[] }

// ── About page ──────────────────────────────────────────────────────────────

export const ABOUT_INTRO: Record<'ar' | 'en', Block[]> = {
  ar: [
    { type: 'h', text: 'تمهيد' },
    {
      type: 'p',
      text: 'تعتبر لحظة طوفان الأقصى لحظة مفصلية في تاريخ القضية الفلسطينية بشكل خاص، وفي تاريخ الأمة العربية والإسلامية بشكل عام؛ حيث أعادت تعريف حدود القوة، وشكّلت وعيًا جديدًا بطبيعة الصراع القائم مع الكيان الصهيوني، ووضعت القضية الفلسطينية في مقدمة الاهتمامات الدولية. فطوفان الأقصى قد تجاوز صنم فارق القوة، وأسطورة الجيش الذي لا يُقهر، وخرج بالمقاومة من دائرة رد الفعل الدفاعية إلى دائرة الفعل الهجومية؛ المدافعة عن الحق وعن الحرية والتحرر والتحرير.',
    },
    {
      type: 'p',
      text: 'وإن هذا الواقع الجديد، واقع ما بعد طوفان الأقصى، يتطلب من العقول الحية إعادة بناء الوعي الجمعي لشباب الأمة العربية والإسلامية: صناعة القوة الفكرية، وتشكيل المقاومة الثقافية التي لا تُقهر، ومواجهة روايات الاحتلال المضلِّلة، ومقاومة تحديات الاستلاب الثقافي والسياسي. لذلك ظهرت الحاجة الملحّة لتأسيس حواضن معرفية وتربوية منظّمة وعصرية.',
    },
    {
      type: 'p',
      text: 'ومن هنا تأتي أكاديمية جيل الطوفان، كجهد معرفي وتربوي وتعبوي فكري، لتقدّم نموذجًا معرفيًا وتربويًا يواكب لحظة طوفان الأقصى، ويؤسس لجيل النصر المنشود، ويربط بين أصالة الوعي التربوي وعصرية أدوات الفهم والتحليل والفعل، سواء الثقافية أو السياسية أو الإعلامية أو الميدانية، من أجل حمل القضية الفلسطينية بوعي وعلم وكفاءة ومسؤولية.',
    },
    { type: 'h', text: 'الفلسفة التأسيسية' },
    {
      type: 'p',
      text: 'لا تنطلق أكاديمية جيل الطوفان من مجرد رد فعل تعليمي على أحداث سياسية، بل تؤسس لفلسفة معرفية وتربوية عميقة، تنبثق من دلالات وتحديات ورهانات الطوفان باعتباره حدثًا تاريخيًا ومفصليًا:',
    },
    {
      type: 'ul',
      items: [
        'تحطيم وهم الحتمية والقدرية السياسية: أثبت طوفان الأقصى أن القوى الاستعمارية المهيمنة، رغم تفوقها المادي والعسكري والتكنولوجي، قابلة للانكسار والهزيمة أمام إرادة واعية ومسؤولة ومنظمة. لذلك تسعى الأكاديمية إلى التخلص من «عقدة النقص» وصفة «قابلية الهزيمة» والتبعية للآخر لدى الشباب العربي والإسلامي.',
        'العبور من المقاومة إلى التحرير: نقل طوفان الأقصى القضية الفلسطينية من مسار التفاوض العبثي إلى مسار الحسم الجذري. لذلك تعمل الأكاديمية على الانتقال بالوعي الشبابي من عقلية الدفاع وتحسين شروط العيش تحت الاحتلال، إلى عقلية الهجوم والفعل الواعي والمسؤول والمنظم والموجَّه إلى التحرير الشامل.',
        'كشف زيف منظومة الأخلاق الغربية: مثّل طوفان الأقصى فرزًا حضاريًا، فضح ازدواجية المعايير وأسقط أقنعة حقوق الإنسان والقانون الدولي. لذلك تعمل الأكاديمية على بناء بديل معرفي وأخلاقي ينطلق من أصالة الأمة وحضارتها العريقة وإرثها الأخلاقي الكبير.',
        'استعادة البعد الأممي للقضية: أعاد طوفان الأقصى ربط الأمة العربية والإسلامية بفلسطين، وكشف أن الحدود الحقيقية مرسومة في العقول قبل الخرائط. لذلك تسعى الأكاديمية إلى تجاوز الحدود الجغرافية والسياسية المصطنعة، وتجعل من كل شاب عربي ومسلم شريكًا مباشرًا وفعّالًا في معركة التحرير الشاملة.',
      ],
    },
  ],
  en: [
    { type: 'h', text: 'Preface' },
    {
      type: 'p',
      text: 'The Al-Aqsa Flood was a turning point in the history of the Palestinian cause and of the Arab and Muslim nation. It redrew the boundaries of power, shaped a new awareness of the nature of the conflict with the Zionist entity, and placed Palestine at the forefront of international attention. It broke the idol of the power gap and the myth of the invincible army, and moved the resistance from defensive reaction to deliberate action in defence of right, freedom, and liberation.',
    },
    {
      type: 'p',
      text: 'This new reality demands that living minds rebuild the collective awareness of the nation’s youth: building intellectual strength, shaping a cultural resistance that cannot be defeated, confronting the occupation’s misleading narratives, and resisting cultural and political alienation. Hence the urgent need for organised, contemporary spaces of knowledge and education.',
    },
    {
      type: 'p',
      text: 'Jeel Al-Toufan Academy answers that need as an intellectual, educational, and mobilising effort: a model that keeps pace with the moment of the Flood, lays the ground for the generation of the awaited victory, and joins the authenticity of educational awareness with contemporary tools of understanding, analysis, and action, cultural, political, media, and field, so that the Palestinian cause is carried with awareness, knowledge, competence, and responsibility.',
    },
    { type: 'h', text: 'Founding philosophy' },
    {
      type: 'p',
      text: 'The Academy is not a mere educational reaction to political events. It rests on a deep philosophy of knowledge and education drawn from the meanings, challenges, and stakes of the Flood as a historic turning point:',
    },
    {
      type: 'ul',
      items: [
        'Breaking the illusion of political inevitability: the Flood proved that dominant colonial powers, despite material, military, and technological superiority, can be broken by a conscious, responsible, organised will. The Academy works to rid Arab and Muslim youth of the inferiority complex, the habit of defeat, and dependence on others.',
        'Crossing from resistance to liberation: the Flood moved the cause from futile negotiation to decisive resolution. The Academy moves young people from a defensive mindset of improving life under occupation to a mindset of conscious, responsible, organised action aimed at comprehensive liberation.',
        'Exposing the hollowness of Western moral order: the Flood revealed double standards and stripped the masks from human rights and international law. The Academy builds a moral and intellectual alternative rooted in the nation’s authenticity, civilisation, and ethical heritage.',
        'Restoring the cause’s pan-national dimension: the Flood reconnected the nation with Palestine and showed that real borders are drawn in minds before maps. The Academy crosses artificial geographic and political borders and makes every young Arab and Muslim a direct, effective partner in the battle for liberation.',
      ],
    },
  ],
}

export const VISION: L = {
  ar: 'تقوم رؤية الأكاديمية على الريادة العالمية في بناء جيل شبابي واعٍ فكريًا، متمكّن سياسيًا، مسؤول أخلاقيًا، ومستمسك بالحق الفلسطيني كقضية مركزية للأمة.\n«أن تكون أكاديمية جيل الطوفان منصة رائدة في بناء جيل عربي وإسلامي واعٍ بالقضية الفلسطينية، مؤهَّل معرفيًا وقياديًا وقادر على صناعة الأثر.»\nالعمق الفكري + التوازن النفسي + الرؤية الاستراتيجية = المساهمة في التحرر والتحرير الفعلي والشامل.',
  en: 'The Academy’s vision is global leadership in building a generation of young people who are intellectually aware, politically capable, morally responsible, and committed to the Palestinian right as the nation’s central cause.\n“To be a leading platform in building an Arab and Muslim generation aware of the Palestinian cause, qualified in knowledge and leadership, and able to make an impact.”\nIntellectual depth + psychological balance + strategic vision = a real contribution to liberation.',
}

/** «القيم الحاكمة» — the three values the academy names. */
export const VALUES: { title: L; text: L }[] = [
  {
    title: { ar: 'الأصالة والوعي', en: 'Authenticity and awareness' },
    text: {
      ar: 'الارتباط بالجذور العقدية والتاريخية للفكر الإسلامي وللقضية الفلسطينية.',
      en: 'Rootedness in the creedal and historical foundations of Islamic thought and of the Palestinian cause.',
    },
  },
  {
    title: { ar: 'المهنية والأكاديمية', en: 'Professionalism and rigour' },
    text: {
      ar: 'تقديم محتوى علمي وتدريبي عالي الجودة بعيدًا عن العشوائية والاعتباطية.',
      en: 'High-quality academic and training content, far from improvisation and arbitrariness.',
    },
  },
  {
    title: { ar: 'الفاعلية والأثر', en: 'Effectiveness and impact' },
    text: {
      ar: 'التركيز على المخرجات العملية والمشاريع الميدانية: المقاومة الحقيقية على الأرض.',
      en: 'A focus on practical outcomes and field projects: real resistance on the ground.',
    },
  },
]

export const GOALS: LL = {
  ar: [
    'بناء الوعي السياسي وتفكيك السرديات الصهيونية: تزويد المنتسبين بالفهم العميق والوعي الدقيق للصراع (تاريخيًا وسياسيًا وقانونيًا) وتفنيد الدعاية المضادة والمضلِّلة.',
    'التزكية التربوية والروحية والنفسية: تعزيز القيم الأخلاقية والصلابة النفسية وروح المبادرة والمسؤولية لدى الشباب.',
    'تطوير المهارات القيادية والأدواتية: تدريب الشباب على مهارات المناصرة الرقمية والميدانية والدبلوماسية الشعبية وصناعة المحتوى المؤثر.',
    'تأسيس شبكة أمان معرفية: خلق مجتمع شبابي مترابط عابر للحدود يشكّل جبهة إسناد دائمة ومستمرة للقضية الفلسطينية، تكون نواة التحرير الشامل.',
    'إعادة صياغة الوعي التاريخي والسياسي: تقديم قراءة للتاريخ والواقع الراهن قائمة على سنن التدافع والتحرير، لا على سرديات الاستسلام والواقعية السياسية المشوَّهة.',
    'توطين المعرفة المقاوِمة: تحويل المعارف النظرية حول القضية الفلسطينية إلى أدوات اشتباك معرفي وسياسي وإعلامي في الفضاءات المحلية والدولية.',
    'صناعة النخبة القيادية: تجميع الطاقات الشبابية المتميزة في الأمة وصهرها في بوتقة فكرية واحدة تشكّل النواة الصلبة لقيادة حراكات التحرير في مجتمعاتها.',
    'بناء عقيدة الصمود والمقاومة والصلابة النفسية: تأهيل الشباب لمواجهة الحرب النفسية وحملات تشويه الوعي ومحاولات التطبيع الفكري.',
  ],
  en: [
    'Building political awareness and dismantling Zionist narratives: a deep, precise understanding of the conflict (historical, political, legal) and refutation of hostile and misleading propaganda.',
    'Educational, spiritual, and psychological formation: strengthening moral values, resilience, initiative, and responsibility among young people.',
    'Developing leadership and practical skills: training in digital and field advocacy, popular diplomacy, and impactful content creation.',
    'Establishing a knowledge safety net: a connected, cross-border youth community that forms a permanent support front for the Palestinian cause and the nucleus of comprehensive liberation.',
    'Reframing historical and political awareness: a reading of history and the present built on the laws of struggle and liberation, not on narratives of surrender and distorted political realism.',
    'Localising resistant knowledge: turning theoretical knowledge about Palestine into tools of intellectual, political, and media engagement in local and international spaces.',
    'Forming a leadership elite: gathering the nation’s outstanding young talents into one intellectual crucible that becomes the solid core leading liberation movements in their societies.',
    'Building a doctrine of steadfastness and resilience: preparing young people to face psychological warfare, campaigns that distort awareness, and attempts at intellectual normalisation.',
  ],
}

// ── Structure (دليل المؤسسات) ──────────────────────────────────────────────

export const STRUCTURE_INTRO: Record<'ar' | 'en', Block[]> = {
  ar: [
    {
      type: 'p',
      text: 'يتكوّن الهيكل القيادي للأكاديمية من ثلاث مرجعيات رئيسية: مجلس الرئاسة باعتباره المرجعية العليا للتوجيه والإشراف الاستراتيجي، ومجلس الإدارة باعتباره الجهاز المسؤول عن الإدارة والتنفيذ، والمجلس العلمي باعتباره المرجعية العلمية والأكاديمية المسؤولة عن جودة المناهج والبرامج والمحتوى.',
    },
    {
      type: 'p',
      text: 'القاعدة الحاكمة: مجلس الرئاسة يوجّه ويعتمد، مجلس الإدارة ينفّذ ويتابع، والمجلس العلمي يراجع ويضمن الجودة.',
    },
    {
      type: 'p',
      text: 'تقوم الأكاديمية، في علاقة بالعمل داخل مؤسساتها، على مبدأ العمل التطوعي في مختلف المهام القيادية والعلمية والتنفيذية والإدارية؛ قيمة مؤسسية نبيلة قائمة على البذل وتحمّل المسؤولية، تجمع بين روح التطوع ومهنية الأداء.',
    },
  ],
  en: [
    {
      type: 'p',
      text: 'The Academy’s leadership rests on three bodies: the Presidency Council as the highest authority for strategic direction and oversight, the Board of Directors as the body responsible for management and execution, and the Scientific Council as the academic authority responsible for the quality of curricula, programs, and content.',
    },
    {
      type: 'p',
      text: 'The governing rule: the Presidency Council directs and approves, the Board of Directors executes and follows up, and the Scientific Council reviews and guarantees quality.',
    },
    {
      type: 'p',
      text: 'Work within the Academy’s institutions is voluntary across leadership, academic, executive, and administrative roles: a noble institutional value built on giving and responsibility, combining the spirit of volunteering with professional performance.',
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
      ar: 'أعلى مرجعية قيادية وإشرافية في الأكاديمية؛ يحدد الرؤية والتوجهات الاستراتيجية، ويعتمد البرامج والمشاريع والشراكات، ويشرف على أداء الأكاديمية واستدامتها. يجتمع كل ثلاثة أشهر، واستثنائيًا عند الحاجة.',
      en: 'The highest leadership and oversight authority: it sets the vision and strategic direction, approves programs, projects, and partnerships, and oversees the Academy’s performance and sustainability. It meets quarterly, and exceptionally when needed.',
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
      ar: 'الجهاز الإداري والتشغيلي المسؤول عن تحويل قرارات مجلس الرئاسة وتوصيات المجلس العلمي إلى خطط وبرامج قابلة للتنفيذ والقياس. ثلاثة عشر عضوًا يتولى كل منهم ملفًا تنفيذيًا محددًا؛ يجتمع شهريًا.',
      en: 'The administrative and operational body that turns the Presidency Council’s decisions and the Scientific Council’s recommendations into executable, measurable plans and programs. Thirteen members, each holding a defined executive portfolio; it meets monthly.',
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
      ar: 'المرجعية العلمية المستقلة المسؤولة عن جودة المحتوى والمناهج؛ يضع المعايير العلمية للبرامج واختيار المدربين، ويراجع المناهج والحقائب ويعتمدها، ويشرف على الدراسات والأبحاث، ويعتمد معايير تقييم مشاريع التخرج. يجتمع كل ثلاثة أشهر، ويضم أكاديميين وباحثين وخبراء من تخصصات متنوعة.',
      en: 'The independent academic authority responsible for the quality of content and curricula: it sets the academic standards for programs and trainer selection, reviews and approves curricula and training kits, supervises studies and research, and approves the criteria for graduation projects. It meets quarterly and brings together academics, researchers, and experts from varied fields.',
    },
    members: [],
  },
]

// ── Programs (مناهج التدريب) ────────────────────────────────────────────────

export const AUDIENCE: Record<'ar' | 'en', Block[]> = {
  ar: [
    {
      type: 'p',
      text: 'الشباب والشابات من العالم العربي والإسلامي والجاليات المسلمة في الغرب، من عمر 18 إلى 35 سنة: طلاب الجامعات، والخريجون الجدد، والشباب العامل.',
    },
  ],
  en: [
    {
      type: 'p',
      text: 'Young women and men from the Arab and Muslim world and Muslim communities in the West, aged 18 to 35: university students, recent graduates, and young professionals.',
    },
  ],
}

/** The four competencies every directed program works towards. */
export const COMPETENCIES: LL = {
  ar: [
    'الكفاية القيمية والشخصية: الهوية، المسؤولية، الانضباط، أخلاقيات العمل.',
    'الكفاية المعرفية والتحليلية: التاريخ، السياسة، القانون الدولي، تحليل السرديات، التفكير النقدي.',
    'الكفاية القيادية والاجتماعية: القيادة، التواصل، العمل الجماعي، إدارة الخلاف، إدارة المبادرات.',
    'الكفاية الإعلامية والرقمية: التحقق من المعلومات، صناعة المحتوى، الاتصال الاستراتيجي، الثقافة الرقمية.',
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
      text: 'تُعقد البرامج الموجّهة الأربعة بشكل متزامن، ويُسجَّل في برنامج واحد فقط حسب رغبة وحاجة واختصاص المشاركين والمشاركات.',
    },
    {
      type: 'ul',
      items: [
        'معايير القبول: الدافع والرغبة في التعلم، القدرة على الالتزام، الحد الأدنى من المهارات الرقمية، التنوع الجغرافي والمهني، مقابلة أو نموذج تحفيزي.',
        'معايير الاستمرار: الحضور، المشاركة، الجدية، إنجاز التكليفات، الالتزام بميثاق السلوك.',
        'معايير التخرج: نسبة حضور محددة، اجتياز التقييم، إنجاز المشروع، تقييم الفريق، عرض المشروع أمام لجنة.',
      ],
    },
    {
      type: 'p',
      text: 'لا تعتمد الأكاديمية على الاختبارات التقليدية؛ يُشترط للتخرج تقديم مشروع اشتباك عملي (حملة إعلامية، بحث سياسي، مبادرة ميدانية) يُعرض في الشهر التاسع من كل سنة.',
    },
  ],
  en: [
    {
      type: 'p',
      text: 'The four directed programs run concurrently; participants enrol in one program only, according to their interest, need, and background.',
    },
    {
      type: 'ul',
      items: [
        'Admission: motivation and willingness to learn, ability to commit, basic digital skills, geographic and professional diversity, an interview or a motivation form.',
        'Continuation: attendance, participation, seriousness, completed assignments, adherence to the code of conduct.',
        'Graduation: a set attendance rate, passing the assessment, completing the project, team evaluation, presenting the project to a panel.',
      ],
    },
    {
      type: 'p',
      text: 'The Academy does not rely on conventional exams: graduation requires a practical engagement project (a media campaign, a political study, a field initiative), presented in September each year.',
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
      ar: 'إشاعة المعرفة الأساسية داخل أوساط واسعة من عموم شباب الأمة: ثماني محاضرات شهرية من أكتوبر إلى مايو.',
      en: 'Foundational knowledge for the widest circle of the nation’s youth: eight monthly lectures from October to May.',
    },
    intro: {
      ar: [
        {
          type: 'p',
          text: 'يهدف التدريب المفتوح إلى إشاعة المعرفة الأساسية داخل أوساط واسعة من عموم شباب الأمة، لتعزيز الوعي بضرورة نصرة قضية القدس وفلسطين، من خلال محاضرات شهرية تنطلق من الشهر العاشر لسنة جارية إلى الشهر الخامس لسنة مقبلة؛ ثماني محاضرات سنويًا.',
        },
        {
          type: 'p',
          text: 'التدريب المفتوح متعدد المواسم، بمحتوى ومضمون متطور ومتجدد في كل موسم جديد يواكب متطلبات الطوفان ومقتضيات الواقع. ويحمل كل موسم اسم شخصية قيادية ورمزية مرتبطة بالقضية الفلسطينية وبالأمة العربية والإسلامية. عنوانه: اكتشف وتعلّم.',
        },
      ],
      en: [
        {
          type: 'p',
          text: 'Open Training spreads foundational knowledge among the widest circle of the nation’s youth and strengthens awareness of the duty to support Al-Quds and Palestine, through monthly lectures from October of one year to May of the next: eight lectures a season.',
        },
        {
          type: 'p',
          text: 'It runs over many seasons, with content renewed each season to match the demands of the Flood and the realities of the moment. Each season carries the name of a leading, symbolic figure tied to the Palestinian cause and the Arab and Muslim nation. Its motto: discover and learn.',
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
      ar: 'برنامج نظري: فهم أصل الصراع والواقع الراهن للقضية الفلسطينية.',
      en: 'Theoretical program: understanding the origin of the conflict and the current reality of the Palestinian cause.',
    },
    intro: {
      ar: [
        { type: 'p', text: 'برنامج نظري غايته فهم أصل الصراع والواقع الراهن للقضية الفلسطينية.' },
        {
          type: 'p',
          text: 'يقوم على المسار المعرفي والسياسي: تاريخ فلسطين وفقه الصراع من الجذور التاريخية إلى معركة طوفان الأقصى وتداعياتها الاستراتيجية؛ النظام الدولي والقضية الفلسطينية (المؤسسات الدولية، القانون الدولي، المنظومة السياسية الحاكمة وموقع فلسطين منها)؛ والمنظومة الصهيونية (تفكيك بنية الكيان، نقاط قوته وضعفه، مشاريع التطبيع وكيفية مواجهتها ومقاومتها).',
        },
      ],
      en: [
        {
          type: 'p',
          text: 'A theoretical program whose aim is understanding the origin of the conflict and the current reality of the Palestinian cause.',
        },
        {
          type: 'p',
          text: 'It follows the knowledge and politics track: the history of Palestine and the anatomy of the conflict from its roots to the Al-Aqsa Flood and its strategic consequences; the international order and the Palestinian cause (international institutions, international law, the governing political system and Palestine’s place in it); and the Zionist system (dismantling the entity’s structure, its strengths and weaknesses, normalisation projects and how to confront and resist them).',
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
      ar: 'برنامج نظري: صناعة الشخصية القيادية.',
      en: 'Theoretical program: forming the leadership personality.',
    },
    intro: {
      ar: [
        { type: 'p', text: 'برنامج نظري غايته صناعة الشخصية القيادية.' },
        {
          type: 'p',
          text: 'يقوم على المسار التربوي والقيمي: بناء الشخصية القيادية الرسالية (قيم التضحية والصمود والمقاومة، والارتباط بالمسجد الأقصى والقدس كمركز للهوية)؛ الصلابة النفسية ومواجهة الإحباط (أدوات التعامل مع الأزمات الإنسانية والسياسية وضمان ديمومة العمل الفكري والميداني)؛ وأخلاقيات المدافعة والعمل الجماعي (فقه العمل المؤسسي والتعاون بين مكونات الأمة المختلفة).',
        },
      ],
      en: [
        {
          type: 'p',
          text: 'A theoretical program whose aim is forming the leadership personality.',
        },
        {
          type: 'p',
          text: 'It follows the educational and values track: building a mission-driven leader (the values of sacrifice, steadfastness, and resistance, and attachment to Al-Aqsa and Al-Quds as the centre of identity); resilience and facing despair (tools for handling human and political crises and sustaining intellectual and field work); and the ethics of advocacy and teamwork (institutional work and cooperation among the nation’s components).',
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
      ar: 'برنامج تطبيقي: صناعة المحتوى الإعلامي والتأثير الرقمي.',
      en: 'Applied program: media content creation and digital influence.',
    },
    intro: {
      ar: [
        { type: 'p', text: 'برنامج تطبيقي غايته صناعة المحتوى الإعلامي والتأثير الرقمي.' },
        {
          type: 'p',
          text: 'يدرّب المشاركين على مهارات المناصرة الرقمية، والتحقق من المعلومات، وصناعة المحتوى المؤثر، والاتصال الاستراتيجي، وملاحقة المحتوى الرقمي المناصر للقضية الفلسطينية في مختلف وسائل التواصل الاجتماعي.',
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
      ar: 'برنامج تطبيقي: تصميم الحملات الميدانية وإدارة المبادرات المجتمعية.',
      en: 'Applied program: designing field campaigns and managing community initiatives.',
    },
    intro: {
      ar: [
        {
          type: 'p',
          text: 'برنامج تطبيقي غايته تصميم الحملات الميدانية وإدارة المبادرات المجتمعية.',
        },
        {
          type: 'p',
          text: 'يدرّب المشاركين على مهارات المناصرة الميدانية والدبلوماسية الشعبية، وبناء حملات المقاطعة الاقتصادية والثقافية والسياسية المنظمة، وتأسيس نوادٍ وجمعيات شبابية في الجامعات والمجتمعات، وبعث مشاريع من أجل القدس وفلسطين.',
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
      ar: 'مشاريع نوعية مرافقة للمنظومة التدريبية، تساهم بشكل فعّال ومباشر في جهود التحرير الشامل.',
      en: 'Flagship projects alongside the training system, contributing directly and effectively to the effort of comprehensive liberation.',
    },
    intro: {
      ar: [
        {
          type: 'p',
          text: 'إلى جانب التربية والتكوين والبرامج التدريبية، تطلق الأكاديمية جملة من المشاريع الاستراتيجية التي تساهم بشكل فعّال ومباشر في جهود التحرير الشامل: مشاريع نوعية مرافقة للمنظومة التربوية والتدريبية، توسّع أثر الأكاديمية وتحوّل المعرفة إلى هوية ودور ومسؤولية.',
        },
        { type: 'p', text: '[تفاصيل كل مشروع تُنشر في ورقة مستقلة.]' },
      ],
      en: [
        {
          type: 'p',
          text: 'Alongside education, training, and the programs, the Academy launches strategic projects that contribute directly and effectively to the effort of comprehensive liberation: flagship projects accompanying the educational and training system, widening the Academy’s impact and turning knowledge into identity, role, and responsibility.',
        },
        { type: 'p', text: '[Details of each project are published in a separate paper.]' },
      ],
    },
    duration: { ar: 'على مدار السنة', en: 'Year-round' },
  },
}

// ── Camp ────────────────────────────────────────────────────────────────────

export const CAMP = {
  summary: {
    ar: 'تتويج سنوي لكل البرامج والمحاضرات: خاتمة عملية تُعقد في الشهر التاسع من كل سنة، بعد نهاية التكوين المفتوح والموجّه. [التواريخ والمكان مؤقتة]',
    en: 'The annual culmination of all programs and lectures: a practical conclusion held each September, after Open and Directed Training end. [Dates and location are placeholders]',
  },
  body: {
    ar: [
      {
        type: 'p',
        text: 'مخيمات جيل الطوفان هي تتويج سنوي لكل البرامج والمحاضرات، حيث تعتبر خاتمة عملية تُعقد بعد نهاية التكوين المفتوح والتكوين الموجّه، في الشهر التاسع من كل سنة؛ أي أنها الحلقة التي تربط كل المنظومة التربوية والتكوينية للأكاديمية.',
      },
      {
        type: 'p',
        text: 'ويُعتبر المخيم بمثابة مرحلة التجربة والتطبيق والاندماج، وليس مجرد رحلة أو نشاط ترفيهي: فضاءات تفاعلية مباشرة تنقل المشاركين والمشاركات من التعلم النظري إلى التجربة الجماعية والتطبيق العملي، على مدار أسبوع كامل يجمع بين المعرفة، والحوار، وبناء الشخصية، والعمل الجماعي، والمهارات، والمبادرات وإدارة المشاريع التحريرية.',
      },
    ] as Block[],
    en: [
      {
        type: 'p',
        text: 'The Jeel Al-Toufan camps are the annual culmination of all programs and lectures: a practical conclusion held each September, after Open and Directed Training end, the link that binds the Academy’s whole educational and training system.',
      },
      {
        type: 'p',
        text: 'The camp is a stage of experience, application, and integration, not a trip or a leisure activity: direct, interactive spaces that move participants from theoretical learning to collective experience and practical application, over a full week that brings together knowledge, dialogue, character building, teamwork, skills, initiatives, and the management of liberation projects.',
      },
    ] as Block[],
  },
}
