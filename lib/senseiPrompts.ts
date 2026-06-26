// The Sensei (Explicame) prompt library, shipped IN the app so it can't be lost.
// Each prompt has a short chip `label` (what shows in the panel), the full `text`
// (sent to the AI on tap), and relevance `tags` (which card it fits). Spanish, for
// Spanish speakers learning Japanese. 268 prompts in 15 themes.
export type SenseiPrompt = { label: string; text: string; tags: string[] };
export type SenseiTheme = { theme: string; prompts: SenseiPrompt[] };
export type SenseiContext = { expression: string; reading?: string; meaning?: string; sentence?: string };

export const SENSEI_PROMPTS: SenseiTheme[] = [
  {
    "theme": "Vocabulario: significado, matiz y connotación",
    "prompts": [
      {
        "label": "Significado con ejemplo",
        "text": "Explícame el significado de esta palabra con un ejemplo cotidiano y dime en qué situaciones se usa de verdad.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Matiz y connotación",
        "text": "¿Qué matiz o connotación tiene esta palabra: suena neutral, formal, cariñosa, negativa o anticuada?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Diferencia con sinónimo",
        "text": "Esta palabra y su sinónimo más común, ¿en qué se diferencian de significado o de uso?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Frases de ejemplo",
        "text": "Dame dos o tres frases naturales con esta palabra para que entienda cómo funciona en contexto real.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Equivalente en español",
        "text": "¿Esta palabra tiene un equivalente exacto en español o se traduce distinto según el contexto? Explícame los matices.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Crear mnemotécnico",
        "text": "Ayúdame a crear un mnemotécnico en español para recordar el significado de esta palabra.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Hablar o escribir?",
        "text": "¿Esta palabra se usa más al hablar o al escribir? ¿Hay alguna versión más coloquial o más formal?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Connotación cultural",
        "text": "¿Qué connotación cultural tiene esta palabra para los japoneses que un hispanohablante no captaría a primera vista?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Corrige mi frase",
        "text": "Voy a intentar usar esta palabra en una frase mía: corrígeme si el significado o el matiz no encajan.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Varios significados",
        "text": "¿Esta palabra tiene varios significados? Enuméramelos del más común al menos frecuente con un ejemplo de cada uno.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Colocaciones típicas",
        "text": "¿Qué palabras suelen acompañar a esta (colocaciones típicas) para que suene natural y no forzada?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Es un préstamo?",
        "text": "¿Es esta palabra un préstamo de otro idioma? Si lo es, ¿cambia su significado o su matiz respecto al original?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Error típico",
        "text": "¿Cuál es el error más común que cometemos los hispanohablantes al entender o usar esta palabra?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Tono positivo o negativo?",
        "text": "¿Esta palabra es positiva, negativa o neutra? Dame un contexto donde quede claro su tono.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Alternativa más natural",
        "text": "Si quisiera sonar más natural, ¿qué palabra usaría un nativo en lugar de esta en una conversación informal?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Contraste con antónimo",
        "text": "Compárame esta palabra con su antónimo y dame una frase que use ambos para fijar el contraste.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Qué registro?",
        "text": "¿En qué registro encaja esta palabra: la diría a un amigo, a mi jefe, o a un desconocido? Dame alternativas por nivel.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Imagen que evoca",
        "text": "¿Qué imagen o sensación evoca esta palabra para un japonés, más allá de su definición de diccionario?",
        "tags": [
          "word"
        ]
      }
    ]
  },
  {
    "theme": "Vocabulario: uso, registro y colocaciones (cuándo sí / cuándo no)",
    "prompts": [
      {
        "label": "¿Cuándo suena raro?",
        "text": "¿En qué situaciones reales se usa esta palabra y en cuáles sonaría rara o fuera de lugar?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Verbos que acompañan",
        "text": "Dame tres palabras o verbos que suelen acompañar a esta palabra de forma natural en japonés.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Cotidiano y formal",
        "text": "Escribe dos frases con esta palabra: una en contexto cotidiano y otra en contexto más formal.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Corrige mi registro",
        "text": "Voy a usar esta palabra en una frase; corrígeme si el registro o la combinación no suena natural.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Error de traducción",
        "text": "¿Qué error típico cometemos los hispanohablantes al traducir esta palabra demasiado literal del español?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Truco para recordar",
        "text": "Dame un truco o asociación para recordar cuándo SÍ y cuándo NO conviene usar esta palabra.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Matiz cultural",
        "text": "¿Hay un matiz cultural o de cortesía que cambie cuándo es apropiado usar esta palabra?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Alternativa más cortés",
        "text": "Si quiero sonar educado en lugar de directo, ¿qué alternativa más cortés podría usar en vez de esta palabra?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Partícula habitual",
        "text": "¿Con qué partícula o estructura suele combinarse esta palabra de forma habitual?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Mini diálogo",
        "text": "Dame un mini diálogo corto y natural donde alguien usaría esta palabra de manera apropiada.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Palabra parecida",
        "text": "¿Qué palabra parecida se confunde a menudo con esta y cómo distingo cuándo va cada una?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Demasiado fuerte?",
        "text": "Explícame con un ejemplo cuándo esta palabra resulta demasiado fuerte o exagerada para la situación.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Kango o nativa",
        "text": "¿Cómo elijo entre una palabra de origen chino (kango) y una nativa japonesa cuando ambas significan lo mismo?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Aprender colocaciones",
        "text": "Quiero ampliar mi vocabulario activo; dame una estrategia para aprender colocaciones en lugar de palabras sueltas.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Solo en anime?",
        "text": "¿Esta palabra aparece mucho en anime o manga pero suena rara en la vida real? Avísame si es así.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Sufijos y prefijos",
        "text": "¿Qué sufijos o prefijos suelen combinarse con esta palabra para formar otras relacionadas?",
        "tags": [
          "word"
        ]
      }
    ]
  },
  {
    "theme": "Kanji: lecturas on/kun, componentes/radicales, orden de trazos",
    "prompts": [
      {
        "label": "On'yomi o kun'yomi",
        "text": "¿Cuándo se usa la lectura on'yomi de este kanji y cuándo la kun'yomi? Dame una regla práctica.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Lecturas frecuentes",
        "text": "Muéstrame las lecturas más comunes de este kanji y, para cada una, una palabra de ejemplo donde aparezca.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Componentes del kanji",
        "text": "Descompón este kanji en sus componentes y dime qué aporta cada uno al significado o a la lectura.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "El radical",
        "text": "¿Cuál es el radical de este kanji y por qué importa para buscarlo en un diccionario?",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Orden de trazos",
        "text": "Explícame el orden de trazos de este kanji paso a paso y cuál es el primer trazo.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Regla de trazado",
        "text": "Dame una regla general sobre el orden de trazos en kanji (por ejemplo, de arriba a abajo o de izquierda a derecha) con un ejemplo claro.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Mnemotecnia visual",
        "text": "Inventa una mnemotecnia en español que conecte los componentes de este kanji con su significado.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Kanji parecido",
        "text": "Contrasta este kanji con otro que se parece mucho visualmente y dime cómo no confundirlos.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "¿Varias lecturas on?",
        "text": "¿Por qué un mismo kanji puede tener varias lecturas on'yomi? Explícamelo de forma sencilla.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "En palabras compuestas",
        "text": "Dame tres palabras que combinen este kanji con otros y dime qué lectura toma en cada combinación.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Errores de trazado",
        "text": "¿Qué errores típicos cometemos los hispanohablantes con el orden de trazos y cómo evitarlos?",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "¿Solo o compuesto?",
        "text": "Este kanji aparece solo y luego dentro de una palabra compuesta: ¿cómo sé qué lectura corresponde en cada caso?",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Componente fonético",
        "text": "Explícame qué es un componente fonético dentro de un kanji y si este kanji tiene uno que delate su lectura.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Contar los trazos",
        "text": "¿Qué relación tienen los radicales con el número de trazos y cómo cuento bien los trazos de este kanji?",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Frase con kun'yomi",
        "text": "Proponme una frase corta en japonés usando este kanji con su lectura kun'yomi para que la practique.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Origen e historia",
        "text": "Háblame del origen o la historia de este kanji y de cómo su forma antigua explica su trazado actual.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Raíz china del on",
        "text": "Compara la lectura on'yomi de este kanji con la pronunciación china original de la que viene, en términos sencillos.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Familia de componentes",
        "text": "Agrúpame varios kanji que compartan este mismo componente y dime si ese componente da pistas sobre su lectura o significado.",
        "tags": [
          "kanji"
        ]
      }
    ]
  },
  {
    "theme": "Kana e iniciación: hiragana, katakana, dakuten, combinaciones, romaji",
    "prompts": [
      {
        "label": "Cómo se pronuncia",
        "text": "Explícame de forma sencilla qué es esta sílaba y cómo se pronuncia para un hispanohablante.",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Hiragana o katakana",
        "text": "¿Cuál es la diferencia entre el hiragana y el katakana, y cuándo se usa cada uno en japonés?",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Truco para recordarla",
        "text": "Dame un truco o mnemotecnia para no olvidar la forma de este caracter de kana.",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Dakuten y handakuten",
        "text": "¿Qué hace exactamente el dakuten y el handakuten, y cómo cambian el sonido de un kana?",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Kana parecido",
        "text": "Compara este kana con otro que se le parezca visualmente para que no los confunda al leer.",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Combinaciones yōon",
        "text": "¿Cómo se forman las combinaciones con ya, yu, yo pequeñas (yoon) y cómo se leen?",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Pasar a romaji",
        "text": "Conviérteme esta lectura a romaji y explícame con qué sistema de romanización lo haces.",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Error de hispanohablante",
        "text": "¿Qué errores de pronunciación cometemos los hispanohablantes con las vocales y sílabas japonesas?",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Palabras para practicar",
        "text": "Dame tres palabras sencillas escritas solo en hiragana para practicar la lectura de este sonido.",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "La tsu pequeña",
        "text": "¿Para qué sirve la tsu pequeña (sokuon) y cómo afecta a la pronunciación de la palabra?",
        "tags": [
          "kana",
          "word"
        ]
      },
      {
        "label": "La fila ra",
        "text": "¿En qué se diferencian los sonidos de la fila de ra (ra, ri, ru, re, ro) de la 'r' del español?",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Memorizar el silabario",
        "text": "Dame una estrategia eficaz para memorizar todo el silabario hiragana en pocos días.",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Vocales largas",
        "text": "¿Cómo se alargan las vocales en katakana con la barra larga y por qué importa hacerlo bien?",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Palabra en katakana",
        "text": "Ponme un ejemplo de palabra extranjera escrita en katakana y explícame por qué se escribe así.",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Corrígeme la lectura",
        "text": "Corrígeme: si leo esta sílaba como en español, ¿en qué me estoy equivocando exactamente?",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Papel cultural",
        "text": "¿Por qué los niños y principiantes en Japón aprenden primero el hiragana y qué papel cultural tiene?",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Kana como partícula",
        "text": "Explícame por qué wo, ha y he se pronuncian distinto cuando funcionan como partículas.",
        "tags": [
          "kana"
        ]
      },
      {
        "label": "Distinguir de oído",
        "text": "¿Cómo distingo al escuchar entre sílabas parecidas como tsu y su, o shi y chi?",
        "tags": [
          "kana"
        ]
      }
    ]
  },
  {
    "theme": "Acento tonal y pronunciación: contorno, mora, sonidos difíciles",
    "prompts": [
      {
        "label": "Patrón de acento",
        "text": "Explícame el patrón de acento tonal de esta palabra y por qué la altura sube o baja donde lo hace.",
        "tags": [
          "pitch",
          "word"
        ]
      },
      {
        "label": "Mora vs sílaba",
        "text": "¿Qué es una mora y en qué se diferencia de una sílaba? Usa esta palabra como ejemplo para contarlas.",
        "tags": [
          "pitch",
          "word"
        ]
      },
      {
        "label": "Pares por acento",
        "text": "¿Cómo cambia el significado entre dos palabras que se escriben igual pero tienen distinto acento tonal? Dame un par clásico.",
        "tags": [
          "pitch"
        ]
      },
      {
        "label": "Contorno de altura",
        "text": "Marca con flechas el contorno de altura de esta lectura, mora por mora, para que sepa dónde sube y dónde baja.",
        "tags": [
          "pitch"
        ]
      },
      {
        "label": "Acento japonés vs español",
        "text": "¿Por qué a los hispanohablantes nos cuesta tanto el acento tonal japonés si en español ya usamos acento? Explica la diferencia.",
        "tags": [
          "pitch"
        ]
      },
      {
        "label": "¿Tiene caída?",
        "text": "¿Esta palabra tiene una caída de tono? Si la tiene, dime exactamente después de qué mora ocurre.",
        "tags": [
          "pitch",
          "word"
        ]
      },
      {
        "label": "Cómo memorizarlo",
        "text": "Dame un truco o asociación para memorizar el patrón de acento de esta palabra sin tener que repasarla mil veces.",
        "tags": [
          "pitch",
          "word"
        ]
      },
      {
        "label": "La R japonesa",
        "text": "¿Cómo pronuncio la R japonesa? Explícame en qué se parece y en qué se diferencia del sonido entre 'pero' y la L del español.",
        "tags": [
          "pitch"
        ]
      },
      {
        "label": "Vocal corta o larga",
        "text": "¿Cuál es la diferencia de duración entre una vocal corta y una larga en japonés, y cómo afecta a esta palabra el alargarla de más?",
        "tags": [
          "pitch",
          "word"
        ]
      },
      {
        "label": "Consonante doble",
        "text": "¿Cómo se pronuncia la consonante doble (sokuon) de esta palabra? Dame consejos para hacer esa pausa sin meter una vocal.",
        "tags": [
          "pitch",
          "word"
        ]
      },
      {
        "label": "Ensordecimiento vocálico",
        "text": "¿Qué es el ensordecimiento de vocales y por qué la 'u' o la 'i' a veces casi no se oye? Dame ejemplos de cuándo pasa.",
        "tags": [
          "pitch"
        ]
      },
      {
        "label": "Distinguir de oído",
        "text": "¿Cómo diferencio de oído la 'tsu' de la 'su' y la 'shi' de la 'chi'? Dame ejercicios para entrenar el oído.",
        "tags": [
          "pitch"
        ]
      },
      {
        "label": "La n silábica",
        "text": "¿Cómo suena la 'n' silábica al final de mora y por qué cambia según la letra que viene después?",
        "tags": [
          "pitch"
        ]
      },
      {
        "label": "Acento o vocal larga",
        "text": "¿Esta palabra y otra parecida se distinguen solo por el acento o por una vocal larga? Contrástalas para no confundirlas.",
        "tags": [
          "pitch",
          "word"
        ]
      },
      {
        "label": "Acento en la frase",
        "text": "¿Cómo afecta el acento tonal a la frase completa, no solo a la palabra suelta? Explica qué pasa al unir palabras y partículas.",
        "tags": [
          "pitch",
          "word"
        ]
      },
      {
        "label": "Frases para practicar",
        "text": "Dame frases cortas para practicar en voz alta el contorno de altura de esta palabra dentro de una oración natural.",
        "tags": [
          "pitch",
          "word"
        ]
      },
      {
        "label": "Errores típicos",
        "text": "¿Qué errores típicos de pronunciación delatan a un hispanohablante hablando japonés y cómo los corrijo?",
        "tags": [
          "pitch"
        ]
      },
      {
        "label": "¿Vale la pena?",
        "text": "¿Importa de verdad el acento tonal para que me entiendan, o es algo opcional? Explícame cuánto vale la pena enfocarme en esto.",
        "tags": [
          "pitch"
        ]
      }
    ]
  },
  {
    "theme": "Gramática: estructura de la frase, orden, formas y construcciones",
    "prompts": [
      {
        "label": "Orden de la frase",
        "text": "Muéstrame el orden básico de una frase japonesa (sujeto, objeto, verbo) y compáralo con cómo lo diría en español.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Forma negativa y pasada",
        "text": "¿Cómo conviertes esta palabra en su forma negativa y en su forma pasada de manera correcta?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Frases de ejemplo",
        "text": "Dame tres frases de ejemplo cortas que usen esta palabra en distintas estructuras gramaticales.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Formal o casual?",
        "text": "¿Cuál es la diferencia entre la forma desu/masu y la forma plana, y cuándo debo usar cada una?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Error con el verbo",
        "text": "¿Qué error típico cometemos los hispanohablantes al colocar el verbo al final de la frase, y cómo evitarlo?",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Grupo del verbo",
        "text": "Explícame de forma simple a qué grupo de verbos pertenece este verbo y cómo afecta a sus conjugaciones.",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Pedir con cortesía",
        "text": "¿Cómo pediría algo educadamente usando una construcción con esta palabra en una situación real?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Truco de partículas",
        "text": "Dame un truco para recordar el orden de las partículas dentro de la frase sin confundirme.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Forma te (unir frases)",
        "text": "¿Cómo uno dos frases en una sola usando la forma te del verbo, con un ejemplo paso a paso?",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Posesión con の",
        "text": "Contrasta cómo se expresa la posesión o la pertenencia en japonés frente al español con la partícula no.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Formar una pregunta",
        "text": "Construye una pregunta natural en japonés a partir de esta palabra y explícame qué cambia respecto a la afirmación.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Deseo con たい",
        "text": "¿Qué diferencia hay entre expresar deseo con tai y pedir un favor, y cómo se estructura cada uno?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Omitir el sujeto",
        "text": "¿Por qué en japonés se omite tanto el sujeto y cómo sé cuándo es seguro hacerlo sin perder claridad?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Corrige mi frase",
        "text": "Corrígeme esta idea: si quiero decir una frase con esta palabra, ¿dónde suelo equivocarme con el orden o las partículas?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Contadores y posición",
        "text": "Explícame cómo funcionan los contadores y dónde se colocan dentro de la frase al contar objetos.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Condicionales と/ば/たら",
        "text": "¿Cómo transformo una frase afirmativa en condicional usando to, ba o tara, y cuándo conviene cada forma?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Modificar sustantivos",
        "text": "¿Cómo funciona la estructura para modificar un sustantivo con toda una frase delante, como hacen los japoneses?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Acción en curso",
        "text": "¿Cómo expreso que algo está ocurriendo ahora mismo o es un estado continuo, y cómo se construye esa forma?",
        "tags": [
          "word"
        ]
      }
    ]
  },
  {
    "theme": "Partículas: は/が, を, に/で, へ, と, から/まで, の, etc. (preguntas sobre su función)",
    "prompts": [
      {
        "label": "Diferencia wa/ga",
        "text": "Explícame de forma sencilla cuál es la diferencia entre las partículas wa y ga y cuándo se usa cada una.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Por qué ga aquí?",
        "text": "En esta frase, ¿por qué se usa la partícula ga y no wa? Analiza el contexto.",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Función de wo",
        "text": "¿Qué función exacta cumple la partícula wo en esta oración y por qué va justo ahí?",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Diferencia ni/de",
        "text": "Aclárame la diferencia entre ni y de cuando ambas parecen traducirse como 'en' en español.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Ejemplos con ni",
        "text": "Dame tres ejemplos de oraciones cortas donde ni marque destino o lugar, y explícame cada uno.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Diferencia e/ni",
        "text": "¿Cuál es la diferencia entre las partículas e y ni para indicar dirección o destino?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Usos de to",
        "text": "¿Para qué sirve la partícula to y cuántos usos distintos tiene? Dame un ejemplo de cada uno.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Kara y made",
        "text": "Explícame cómo funcionan juntas las partículas kara y made para expresar 'desde' y 'hasta'.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Función de no",
        "text": "¿Qué hace exactamente la partícula no y por qué a veces conecta dos sustantivos como si fuera 'de'?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Mnemotecnia para wo",
        "text": "Dame un truco o mnemotecnia para no olvidar que wo marca el objeto directo de la acción.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Ni o e?",
        "text": "Corrígeme: si quiero decir que voy a la escuela, ¿uso ni o e con la palabra escuela? ¿Y por qué?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Wa y wo juntas",
        "text": "Compara wa y wo en una misma oración: ¿qué papel tiene cada partícula y por qué no se confunden?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Error típico wa/ga",
        "text": "¿Cuál es el error más común que cometemos los hispanohablantes al elegir entre wa y ga?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Ejercicio ni/de",
        "text": "Proponme un ejercicio rápido para practicar la elección entre ni y de con lugares y acciones.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Por qué pospuesta?",
        "text": "¿Por qué el japonés pone la partícula después de la palabra y no antes, como las preposiciones en español?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Cambiar de por ni",
        "text": "¿Qué pasa con el significado de una frase si cambio la partícula de por ni? Dame un ejemplo del cambio.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Omitir la partícula",
        "text": "¿Cuándo se puede omitir una partícula en japonés hablado y por qué suena natural hacerlo?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Test wa vs ga",
        "text": "Hazme tres preguntas tipo test para comprobar si entiendo cuándo usar wa frente a ga.",
        "tags": [
          "word"
        ]
      }
    ]
  },
  {
    "theme": "Verbos y adjetivos: grupos, conjugación, te-form, formas casual/cortés, transitivo/intransitivo",
    "prompts": [
      {
        "label": "¿Qué grupo verbal?",
        "text": "¿A qué grupo verbal pertenece este verbo (godan, ichidan o irregular) y cómo lo reconozco para conjugarlo bien?",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Forma -te",
        "text": "Muéstrame la te-form de este verbo paso a paso y explícame qué regla de sonido se aplica según su terminación.",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Forma cortés -masu",
        "text": "¿Cómo paso esta palabra de su forma de diccionario a la forma cortés en -masu, y cómo se ve en pasado y en negativo?",
        "tags": [
          "verb",
          "word"
        ]
      },
      {
        "label": "Transitivo o intransitivo",
        "text": "Explícame la diferencia entre la versión transitiva y la intransitiva de este verbo y dame una situación donde usaría cada una.",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Adjetivo -i o -na",
        "text": "Este es un adjetivo: ¿es de tipo -i o de tipo -na, y cómo cambia su conjugación en negativo y en pasado según ese tipo?",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Godan vs ichidan",
        "text": "Dame un truco o regla mnemotécnica para no confundir los verbos godan con los ichidan que terminan en -eru o -iru.",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Conjugación completa",
        "text": "Conjuga este verbo en sus formas clave (presente, pasado, negativo, te-form) y dame una frase de ejemplo natural con cada una.",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "¿Casual o cortés?",
        "text": "¿En qué contextos sociales debo usar la forma casual de este verbo y cuándo sería una falta de respeto no usar la forma cortés?",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Encadenar acciones",
        "text": "Crea una frase corta y cotidiana usando este verbo en te-form para encadenar dos acciones, y tradúcemela.",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Ser o estar",
        "text": "Como hispanohablante suelo traducir 'ser' y 'estar' al japonés con el mismo verbo: ¿qué errores típicos cometo y cómo los evito?",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Corrige mi conjugación",
        "text": "Corrige esta conjugación que escribí y dime exactamente en qué regla me equivoqué.",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Adjetivo o verbo",
        "text": "¿Por qué algunos adjetivos en español se vuelven verbos o adjetivos -na en japonés, y cómo sé qué construcción usar con esta palabra?",
        "tags": [
          "verb",
          "word"
        ]
      },
      {
        "label": "Negación verbo y adjetivo",
        "text": "Compara la negación de un verbo (-nai) con la negación de un adjetivo -i y muéstrame por qué se parecen pero no son iguales.",
        "tags": [
          "adjective",
          "verb"
        ]
      },
      {
        "label": "Petición cortés",
        "text": "¿Cómo uso este verbo para hacer una petición cortés en te-form (estilo 'por favor, haz...') y qué tono transmite?",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Adjetivo sin 'ser'",
        "text": "Explícame cuándo un adjetivo -i actúa casi como un verbo y por qué no necesita el verbo 'ser' para formar una oración.",
        "tags": [
          "adjective",
          "verb"
        ]
      },
      {
        "label": "Verbos que se confunden",
        "text": "Dame tres verbos que se confundan fácilmente con este por su significado parecido y muéstrame qué los distingue en el uso real.",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Forma potencial",
        "text": "¿Cómo expreso 'puedo hacer' o la forma potencial de este verbo, y cómo cambia según su grupo?",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "Práctica de producción",
        "text": "Quiero practicar producción: hazme una pregunta para que yo conjugue este verbo en pasado cortés y luego corrígeme.",
        "tags": [
          "verb"
        ]
      }
    ]
  },
  {
    "theme": "Cortesía, keigo y registro social: formal vs casual, cuándo usar cada uno",
    "prompts": [
      {
        "label": "Qué es el keigo",
        "text": "Explícame de forma sencilla qué es el keigo y por qué es tan importante en japonés.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Formal o casual",
        "text": "¿Cuál es la diferencia entre el lenguaje formal (teineigo con desu/masu) y el casual, y cómo decido cuál usar?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Sonkeigo vs kenjougo",
        "text": "Explícame la diferencia entre sonkeigo (lenguaje de respeto) y kenjougo (lenguaje humilde), con la idea clave de cada uno.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Decírselo al jefe",
        "text": "¿Cómo cambiaría esta palabra o esta frase si tuviera que decírsela a mi jefe en lugar de a un amigo?",
        "tags": [
          "sentence",
          "word"
        ]
      },
      {
        "label": "Casual y formal",
        "text": "Dame el equivalente casual y el equivalente formal de esta expresión para ver el contraste lado a lado.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Con quién desu/masu?",
        "text": "¿Con quién debería usar desu/masu y con quién puedo hablar en estilo casual sin sonar grosero?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Cómo suena?",
        "text": "¿Cómo suena esta frase a oídos japoneses: demasiado formal, demasiado directa o adecuada para la situación?",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Pedir un favor",
        "text": "Ayúdame a pedir un favor de forma educada usando esta palabra, como lo haría en una situación de trabajo.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Error del hispanohablante",
        "text": "¿Qué errores de cortesía cometemos los hispanohablantes al pasar del tú/usted del español al sistema de registro japonés?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Mezclar registros?",
        "text": "¿Es un error mezclar formas formales y casuales en la misma conversación? Explícame por qué se nota.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Tres niveles sociales",
        "text": "Dámelo en tres niveles: cómo se lo diría a un amigo, a un compañero y a un cliente o superior.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Keigo con amigos",
        "text": "¿Qué pasa si uso keigo con un amigo cercano? ¿Puede sonar frío o distante en lugar de educado?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Truco para recordarlo",
        "text": "Dame un truco o regla mental para recordar cuándo toca sonkeigo y cuándo toca kenjougo sin confundirlos.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Uchi y soto",
        "text": "¿Cómo se relaciona el concepto de uchi (dentro) y soto (fuera del grupo) con el nivel de cortesía que debo usar?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Registro en tiendas",
        "text": "En una tienda o restaurante en Japón, ¿qué registro escucharé del personal y cómo debería responder yo educadamente?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Suavizar la frase",
        "text": "Corrígeme si esta frase suena demasiado brusca y dime cómo suavizarla para una situación formal.",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Cortesía básica primero",
        "text": "¿Qué fórmulas de cortesía básicas (saludos, disculpas, agradecimientos) debería dominar primero antes de meterme en keigo avanzado?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Practicar el cambio",
        "text": "¿Cómo puedo practicar el cambio de registro en mi cabeza para que me salga natural en una conversación real?",
        "tags": [
          "word"
        ]
      }
    ]
  },
  {
    "theme": "Palabras y formas parecidas: diferencias y cuándo elegir cada una",
    "prompts": [
      {
        "label": "Diferenciar dos similares",
        "text": "¿En qué se diferencian las dos palabras japonesas que más se parecen a esta y cuándo elijo cada una?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Matiz entre sinónimos",
        "text": "¿Hay otra palabra japonesa con un significado muy cercano a esta? Explícame el matiz que las separa.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Cambia el registro?",
        "text": "Esta palabra y su sinónimo más común, ¿se usan en los mismos contextos o cambia el registro?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Frases de ejemplo",
        "text": "Dame un ejemplo donde esta palabra sería correcta y otro donde habría que usar su sinónimo más parecido.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Error típico",
        "text": "¿Qué error suelen cometer los hispanohablantes al confundir esta palabra con otra muy similar?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Truco para no confundir",
        "text": "Necesito un truco para no confundir esta palabra con la que se le parece tanto. ¿Me das una mnemotecnia?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Formal o casual?",
        "text": "Si tuviera que elegir entre esta palabra y una más formal con el mismo sentido, ¿cuál uso al hablar con un amigo?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Verbos casi sinónimos",
        "text": "¿Cuál es la diferencia entre el verbo de esta tarjeta y un verbo casi sinónimo? Ponme un par de ejemplos.",
        "tags": [
          "verb"
        ]
      },
      {
        "label": "¿Coloquial o neutral?",
        "text": "Esta palabra, ¿es más coloquial o más neutral que su equivalente más cercano?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Shiru vs wakaru",
        "text": "Explícame la diferencia entre shiru y wakaru con ejemplos claros de cuándo usar cada uno.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Omou vs kangaeru",
        "text": "¿Cuándo se usa omou y cuándo kangaeru? Me cuesta distinguirlos al hablar.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Pregunta de repaso",
        "text": "Hazme una pregunta rápida para comprobar si sé elegir entre esta palabra y su sinónimo más parecido.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Misma traducción",
        "text": "Tengo dos palabras japonesas que traduzco igual al español pero los nativos las usan distinto. ¿Cómo aprendo a separarlas?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Corrige mi uso formal",
        "text": "Corrígeme: si uso esta palabra en una situación formal, ¿queda raro o existe una variante más apropiada?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Varias palabras, una idea",
        "text": "¿Por qué a veces el japonés tiene varias palabras para algo que en español decimos con una sola, y cómo escojo?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Pares que confunden",
        "text": "Dame tres pares de palabras japonesas que los estudiantes confunden a menudo y la clave para distinguir cada par.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Verbos de vestir",
        "text": "¿Cuál es la diferencia entre dos verbos japoneses que ambos se traducen como 'ponerse' o 'llevar' ropa, según la prenda?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Ir o venir",
        "text": "¿Qué diferencia hay entre las palabras para 'ir' y 'venir' en japonés y cómo elijo según el punto de vista?",
        "tags": [
          "word"
        ]
      }
    ]
  },
  {
    "theme": "Frases y producción: pedir ejemplos, variar, reformular, construir oraciones propias",
    "prompts": [
      {
        "label": "Oraciones de ejemplo",
        "text": "Dame tres oraciones de ejemplo con esta palabra, de la más sencilla a la más avanzada.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Conversación natural",
        "text": "Usa esta palabra en una conversación corta y natural entre dos personas.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Frase cotidiana",
        "text": "Escribe una frase con este kanji que se entienda en un contexto cotidiano.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Decirlo en japonés",
        "text": "Tengo esta idea en español: ayúdame a decirla en japonés usando esta palabra.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Corrige mi frase",
        "text": "Voy a escribir una oración con esta palabra y quiero que me la corrijas si tiene errores.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Más natural",
        "text": "Reformula esta frase para que suene más natural en boca de un nativo.",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Niveles de formalidad",
        "text": "Dame la misma oración en tres niveles de formalidad: casual, neutra y formal.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Pregunta y negativa",
        "text": "Muéstrame cómo cambia esta frase al pasarla a pregunta y a negativa.",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Reto de producción",
        "text": "Quiero practicar producción: dame una situación y reto a construir una frase con esta palabra.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Pasado y futuro",
        "text": "Convierte esta frase en pasado y luego en futuro para ver cómo se transforma.",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Palabras que acompañan",
        "text": "Dame ejemplos de esta palabra acompañada de las palabras con las que suele aparecer.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Mini-diálogo guiado",
        "text": "Escribe un mini-diálogo de tres líneas donde yo tenga que responder usando esta palabra.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Pedir con cortesía",
        "text": "Dime cuál es la forma más común de pedir algo educadamente y dame un ejemplo que pueda usar hoy.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Cambiar sujeto y objeto",
        "text": "Tomo esta frase y quiero variarla cambiando el sujeto y el objeto: dame varias versiones.",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Partir frases largas",
        "text": "Dame una frase larga con esta palabra y luego enséñame a partirla en frases más simples.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Muletillas y relleno",
        "text": "Quiero sonar más natural al hablar: dame muletillas y expresiones de relleno con un ejemplo de cada una.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Completa los huecos",
        "text": "Propón un ejercicio donde yo complete los huecos de una oración usando esta palabra.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Practica el parafraseo",
        "text": "Dame una frase con esta palabra y luego pregúntame cómo la diría yo de otra manera para practicar parafraseo.",
        "tags": [
          "word"
        ]
      }
    ]
  },
  {
    "theme": "Errores típicos de hispanohablantes aprendiendo japonés",
    "prompts": [
      {
        "label": "Error más típico",
        "text": "¿Cuál es el error más típico que cometemos los hispanohablantes con esta palabra y cómo lo evito?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Sonido difícil",
        "text": "Como mi idioma es el español, ¿qué sonido de esta lectura voy a pronunciar mal sin darme cuenta y cómo lo corrijo?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿R o L?",
        "text": "Tendemos a confundir la 'r' japonesa de esta lectura con la 'r' o la 'l' del español. ¿Cómo articulo bien ese sonido?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Vocales largas",
        "text": "En español no alargamos las vocales, así que ignoro las vocales largas y las consonantes dobles. ¿Por qué cambian el significado y cómo las distingo al oír?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Falso amigo",
        "text": "¿Qué falso amigo o calco del español me haría usar mal esta palabra? Dame el malentendido y la forma correcta.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Traducción literal",
        "text": "Quiero decir esta frase 'traduciendo' desde el español. Enséñame por qué eso suena raro en japonés y cómo se diría de forma natural.",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Sujeto innecesario",
        "text": "¿Por qué los hispanohablantes solemos meter un sujeto explícito tipo 'yo' o 'tú' donde el japonés lo omite? Muéstramelo con esta frase.",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Orden SOV",
        "text": "El orden sujeto-objeto-verbo me cuesta porque en español ponemos el verbo en medio. Dame un truco para reordenar esta frase sin pensarlo.",
        "tags": [
          "sentence",
          "verb"
        ]
      },
      {
        "label": "Partícula confusa",
        "text": "¿Qué partícula confundo más fácilmente al traducir esta frase desde el español, por ejemplo wa frente a ga o ni frente a de?",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Género y plural",
        "text": "En español usamos el género gramatical y el plural todo el tiempo. ¿Qué errores me provoca eso en japonés y cómo me reeduco?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Nivel de cortesía",
        "text": "¿Qué nivel de cortesía pide esta frase? Tengo miedo de sonar demasiado informal o demasiado rígido como nos pasa a los principiantes.",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "On'yomi o kun'yomi",
        "text": "Dame una regla sencilla para no equivocarme al elegir entre la lectura on'yomi y kun'yomi de este kanji, que es donde más me trabo.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Par intercambiable",
        "text": "Compárame este par de palabras que los hispanohablantes solemos usar como si fueran intercambiables y explícame cuándo va cada una.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Acento tonal",
        "text": "Estoy entonando esta lectura con el patrón de acento del español. ¿Cómo me está traicionando el oído y qué hago para captar el acento tonal japonés?",
        "tags": [
          "pitch"
        ]
      },
      {
        "label": "Mnemónico en español",
        "text": "Invéntame un mnemónico en español para no volver a confundir esta palabra con la que siempre la mezclo.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Formal o casual?",
        "text": "Corrige este error que sé que cometo: uso desu/masu en todo sin saber cuándo en realidad toca el japonés casual. ¿Cuándo cambio de registro?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Gesto cultural",
        "text": "¿Qué gesto, silencio o convención cultural malinterpretamos los hispanohablantes en una conversación japonesa por dar por hecho lo nuestro?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Tres errores frecuentes",
        "text": "Hazme un repaso de los tres errores que más cometen los principiantes hispanohablantes en general y dime cómo entrenar para dejar de cometerlos.",
        "tags": [
          "word"
        ]
      }
    ]
  },
  {
    "theme": "Mnemotecnia, memoria y repaso espaciado: cómo fijar esta tarjeta",
    "prompts": [
      {
        "label": "Mnemotecnia visual",
        "text": "Créame una mnemotecnia visual y memorable en español para fijar esta palabra de una vez.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Truco para la lectura",
        "text": "No consigo recordar esta lectura: dame un truco para asociarla con algo que ya conozco.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Por qué se olvida",
        "text": "¿Por qué se me olvida este kanji justo después de repasarlo y cómo lo evito?",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Qué es la repetición espaciada",
        "text": "¿Qué es exactamente la repetición espaciada y por qué funciona mejor que repasar muchas veces seguidas?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Repaso activo o pasivo",
        "text": "Diferencia entre repaso pasivo (releer) y repaso activo (recordar de memoria): ¿cuál me conviene con esta tarjeta?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Acabo de fallar",
        "text": "Acabo de fallar esta tarjeta: ¿qué debería hacer ahora para que se me grabe mejor la próxima vez?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Historia absurda",
        "text": "Invéntame una historia corta y absurda que conecte la forma, la lectura y el significado de este kanji.",
        "tags": [
          "kanji"
        ]
      },
      {
        "label": "Palacio de la memoria",
        "text": "¿Cómo uso la técnica de los loci o palacio de la memoria para varias palabras nuevas como esta?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Separar palabras parecidas",
        "text": "Esta palabra se parece a otra que ya estudié y las confundo: ¿cómo las separo en mi memoria?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Frase de ejemplo",
        "text": "Dame una frase de ejemplo fácil de recordar para anclar esta palabra a un contexto concreto.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Cuándo repasar de nuevo",
        "text": "¿Cuándo debería volver a ver esta tarjeta para que el repaso espaciado sea eficaz y no me agote?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Significado y lectura juntos",
        "text": "¿Es buena idea fijar el significado y la lectura por separado, o conviene memorizarlos juntos?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Lectura parecida al español",
        "text": "¿Cómo hago una mnemotecnia para esta lectura aprovechando que suena parecido a una palabra en español?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Tarjetas que siempre fallo",
        "text": "¿Qué hago con las tarjetas que siempre fallo: las repaso aparte o cambio de estrategia?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Recordar con esfuerzo",
        "text": "¿Por qué recordar con esfuerzo (aunque tarde y dude) fija mejor la memoria que ver la respuesta enseguida?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Vista, oído y escritura",
        "text": "Esta tarjeta tiene sonido e imagen: ¿cómo combino vista, oído y escritura para memorizarla mejor?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Método de estudio japonés",
        "text": "¿Hay alguna costumbre o método de estudio típico en Japón que me sirva para fijar vocabulario como este?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Kanji como dibujo mental",
        "text": "Convierte este kanji en un dibujo mental con sus partes como personajes para no olvidarlo nunca.",
        "tags": [
          "kanji"
        ]
      }
    ]
  },
  {
    "theme": "Cultura, contexto real y pragmática: cómo suena, cuándo se dice, matices sociales",
    "prompts": [
      {
        "label": "¿Formal o casual?",
        "text": "¿Esta expresión es más bien formal, neutra o coloquial? ¿Con quién puedo usarla sin quedar mal?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Más educado o casual",
        "text": "¿Hay una forma más educada o más casual de decir esto según con quién hable?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Ejemplo cotidiano",
        "text": "Dame un ejemplo de una conversación cotidiana donde alguien usaría esta palabra de forma natural.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Suena natural?",
        "text": "¿Esta frase suena natural para un japonés o delata que es japonés de libro de texto?",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Matiz social",
        "text": "¿Qué matiz social o emocional añade esta expresión que no se ve solo en la traducción?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Grosero con superiores?",
        "text": "Si le digo esto a mi jefe o a alguien mayor, ¿resulta grosero o está bien? ¿Cómo lo suavizo?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Error de registro",
        "text": "¿Qué error de tono o registro suele cometer un hispanohablante al usar esta palabra?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Diferencia cultural",
        "text": "Explícame la diferencia cultural detrás de esta expresión que no tiene equivalente directo en español.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Honne y tatemae",
        "text": "¿Cómo se relaciona esta palabra con el honne y el tatemae o con evitar la confrontación directa?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "¿Demasiado directo?",
        "text": "¿En qué contexto se considera de mala educación decir esto tan directamente en Japón?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Alternativa natural japonesa",
        "text": "¿Qué diría un japonés en lugar de traducir literalmente esta frase del español?",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "¿Dónde se usa?",
        "text": "¿Esta palabra se usa más entre amigos, en el trabajo, o en situaciones formales?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Malentendido cultural",
        "text": "Cuéntame algún malentendido cultural típico que provoca esta expresión entre extranjeros y japoneses.",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Entonación y tono",
        "text": "¿Cómo cambia el significado o el tono de esta frase según la entonación o el contexto?",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Gesto o etiqueta",
        "text": "¿Qué gesto, costumbre o etiqueta acompaña normalmente a esta expresión en la vida real?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Frases a medias",
        "text": "¿Por qué los japoneses suelen dejar esta frase a medias o sin terminar, y cómo lo interpreto?",
        "tags": [
          "sentence"
        ]
      },
      {
        "label": "Cortesía fija diaria",
        "text": "¿Qué papel tienen las expresiones de cortesía fijas (como las de antes y después de comer) en el día a día japonés?",
        "tags": [
          "word"
        ]
      },
      {
        "label": "Referencia generacional",
        "text": "¿Hay alguna referencia generacional o de moda en esta palabra que la haga sonar joven, anticuada o de internet?",
        "tags": [
          "word"
        ]
      }
    ]
  },
  {
    "theme": "Método de estudio y uso de Akari: rachas, repaso, kana/kanji/acento, motivación",
    "prompts": [
      {
        "label": "Qué es la racha",
        "text": "¿Qué significa exactamente la 'racha' en Akari y por qué es tan importante para aprender japonés?",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Si pierdo la racha",
        "text": "Si pierdo mi racha de estudio, ¿perdí todo mi progreso o solo el contador? Explícame qué pasa con mis tarjetas.",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Repaso o nuevas",
        "text": "¿Qué diferencia hay entre 'repaso' y 'aprender tarjetas nuevas', y a cuál debería dar prioridad cada día?",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Cómo funciona el SRS",
        "text": "¿Cómo funciona la repetición espaciada y por qué a veces una tarjeta reaparece muy pronto y otras veces tarda semanas?",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Repasos atrasados",
        "text": "Tengo muchos repasos atrasados y me agobio. Dame un plan concreto para ponerme al día sin rendirme.",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Por dónde empezar",
        "text": "¿En qué orden me conviene atacar Akari como principiante: kana, kanji, vocabulario o acento? Justifica el orden.",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Diario o concentrado",
        "text": "¿Es mejor estudiar 10 minutos cada día o una hora dos veces por semana? Qué dice la evidencia sobre el repaso diario.",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Rutina de 15 minutos",
        "text": "Dame una rutina realista de 15 minutos al día para combinar repaso, kana y un drill sin quemarme.",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Cuándo dominas el kana",
        "text": "¿Cuándo debo pasar del reconocimiento de kana a los drills de escritura y al sprint de 60 segundos? Cómo sé que ya domino el kana.",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Acento desde el inicio",
        "text": "¿Qué es el acento tonal (pitch accent) y por qué vale la pena practicarlo desde el principio en vez de dejarlo para después?",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Racha en días ocupados",
        "text": "Dame una técnica para no olvidar mantener la racha aunque tenga un día ocupado o esté de viaje.",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Tarjeta que se resiste",
        "text": "Cuando una tarjeta se me resiste y la fallo una y otra vez, ¿qué estrategia uso para que por fin se me quede?",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Errores del hispanohablante",
        "text": "¿Qué errores típicos cometemos los hispanohablantes al estudiar japonés con flashcards y cómo los evito en Akari?",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Avanzar o consolidar",
        "text": "¿Es contraproducente adelantar muchas tarjetas nuevas de golpe? Explícame el equilibrio entre avanzar y consolidar.",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Usar las estadísticas",
        "text": "¿Cómo uso la página de estadísticas de Akari para detectar mis puntos débiles y ajustar mi estudio?",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Mantener la motivación",
        "text": "Pierdo la motivación después de unas semanas. Dame consejos para sostener el hábito a largo plazo y celebrar pequeños logros.",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Cuántas tarjetas diarias",
        "text": "¿Cuánto vocabulario o cuántos kanji es realista aprender por día en Akari sin saturar mis repasos futuros?",
        "tags": [
          "study"
        ]
      },
      {
        "label": "Shadowing y pronunciación",
        "text": "¿Cómo combino el shadowing de audio con el repaso de tarjetas para mejorar también mi pronunciación?",
        "tags": [
          "study"
        ]
      }
    ]
  }
];

/** The whole library flattened — every prompt ships with the app. */
export const ALL_SENSEI_PROMPTS: SenseiPrompt[] = SENSEI_PROMPTS.flatMap((t) => t.prompts);

function isSingleKanji(expression: string): boolean {
  const chars = Array.from(expression.trim());
  return chars.length === 1 && /\p{Script=Han}/u.test(chars[0]);
}

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** A few card-relevant, theme-diverse question suggestions for the Sensei panel:
 *  kanji cards get kanji questions, vocabulary cards get word/sentence questions,
 *  picked one-per-theme so the handful covers different angles. Study-method prompts
 *  stay in the library but aren't surfaced here (they aren't about the card). */
export function suggestedSenseiPrompts(ctx: SenseiContext, count = 4): SenseiPrompt[] {
  const kanji = isSingleKanji(ctx.expression);
  const hasSentence = !!ctx.sentence;
  const fits = (p: SenseiPrompt): boolean =>
    kanji ? p.tags.includes("kanji") : p.tags.includes("word") || (hasSentence && p.tags.includes("sentence"));
  const eligibleThemes = shuffle(
    SENSEI_PROMPTS.map((t) => t.prompts.filter(fits)).filter((ps) => ps.length > 0),
  );
  const picked: SenseiPrompt[] = [];
  for (const ps of eligibleThemes) {
    if (picked.length >= count) break;
    picked.push(ps[Math.floor(Math.random() * ps.length)]);
  }
  return picked;
}
