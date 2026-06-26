// Suggested questions for the Sensei (Explicame) AI panel. The full library lives
// in the app so it ships with every build (not a loose doc) and the user can tap a
// question instead of typing one. Many are card-context-aware ("esta palabra",
// "este kanji", "esta lectura", "esta frase") — the Sensei injects the current card.
// 268 prompts across 15 themes. Spanish, for Spanish speakers learning Japanese.
export type SenseiPromptCategory = { name: string; prompts: string[] };

export const SENSEI_PROMPTS: SenseiPromptCategory[] = [
  {
    "name": "Vocabulario: significado, matiz y connotación",
    "prompts": [
      "Explícame el significado de esta palabra con un ejemplo cotidiano y dime en qué situaciones se usa de verdad.",
      "¿Qué matiz o connotación tiene esta palabra: suena neutral, formal, cariñosa, negativa o anticuada?",
      "Esta palabra y su sinónimo más común, ¿en qué se diferencian de significado o de uso?",
      "Dame dos o tres frases naturales con esta palabra para que entienda cómo funciona en contexto real.",
      "¿Esta palabra tiene un equivalente exacto en español o se traduce distinto según el contexto? Explícame los matices.",
      "Ayúdame a crear un mnemotécnico en español para recordar el significado de esta palabra.",
      "¿Esta palabra se usa más al hablar o al escribir? ¿Hay alguna versión más coloquial o más formal?",
      "¿Qué connotación cultural tiene esta palabra para los japoneses que un hispanohablante no captaría a primera vista?",
      "Voy a intentar usar esta palabra en una frase mía: corrígeme si el significado o el matiz no encajan.",
      "¿Esta palabra tiene varios significados? Enuméramelos del más común al menos frecuente con un ejemplo de cada uno.",
      "¿Qué palabras suelen acompañar a esta (colocaciones típicas) para que suene natural y no forzada?",
      "¿Es esta palabra un préstamo de otro idioma? Si lo es, ¿cambia su significado o su matiz respecto al original?",
      "¿Cuál es el error más común que cometemos los hispanohablantes al entender o usar esta palabra?",
      "¿Esta palabra es positiva, negativa o neutra? Dame un contexto donde quede claro su tono.",
      "Si quisiera sonar más natural, ¿qué palabra usaría un nativo en lugar de esta en una conversación informal?",
      "Compárame esta palabra con su antónimo y dame una frase que use ambos para fijar el contraste.",
      "¿En qué registro encaja esta palabra: la diría a un amigo, a mi jefe, o a un desconocido? Dame alternativas por nivel.",
      "¿Qué imagen o sensación evoca esta palabra para un japonés, más allá de su definición de diccionario?"
    ]
  },
  {
    "name": "Vocabulario: uso, registro y colocaciones (cuándo sí / cuándo no)",
    "prompts": [
      "¿En qué situaciones reales se usa esta palabra y en cuáles sonaría rara o fuera de lugar?",
      "Dame tres palabras o verbos que suelen acompañar a esta palabra de forma natural en japonés.",
      "Escribe dos frases con esta palabra: una en contexto cotidiano y otra en contexto más formal.",
      "Voy a usar esta palabra en una frase; corrígeme si el registro o la combinación no suena natural.",
      "¿Qué error típico cometemos los hispanohablantes al traducir esta palabra demasiado literal del español?",
      "Dame un truco o asociación para recordar cuándo SÍ y cuándo NO conviene usar esta palabra.",
      "¿Hay un matiz cultural o de cortesía que cambie cuándo es apropiado usar esta palabra?",
      "Si quiero sonar educado en lugar de directo, ¿qué alternativa más cortés podría usar en vez de esta palabra?",
      "¿Con qué partícula o estructura suele combinarse esta palabra de forma habitual?",
      "Dame un mini diálogo corto y natural donde alguien usaría esta palabra de manera apropiada.",
      "¿Qué palabra parecida se confunde a menudo con esta y cómo distingo cuándo va cada una?",
      "Explícame con un ejemplo cuándo esta palabra resulta demasiado fuerte o exagerada para la situación.",
      "¿Cómo elijo entre una palabra de origen chino (kango) y una nativa japonesa cuando ambas significan lo mismo?",
      "Quiero ampliar mi vocabulario activo; dame una estrategia para aprender colocaciones en lugar de palabras sueltas.",
      "¿Esta palabra aparece mucho en anime o manga pero suena rara en la vida real? Avísame si es así.",
      "¿Qué sufijos o prefijos suelen combinarse con esta palabra para formar otras relacionadas?"
    ]
  },
  {
    "name": "Kanji: lecturas on/kun, componentes/radicales, orden de trazos",
    "prompts": [
      "¿Cuándo se usa la lectura on'yomi de este kanji y cuándo la kun'yomi? Dame una regla práctica.",
      "Muéstrame las lecturas más comunes de este kanji y, para cada una, una palabra de ejemplo donde aparezca.",
      "Descompón este kanji en sus componentes y dime qué aporta cada uno al significado o a la lectura.",
      "¿Cuál es el radical de este kanji y por qué importa para buscarlo en un diccionario?",
      "Explícame el orden de trazos de este kanji paso a paso y cuál es el primer trazo.",
      "Dame una regla general sobre el orden de trazos en kanji (por ejemplo, de arriba a abajo o de izquierda a derecha) con un ejemplo claro.",
      "Inventa una mnemotecnia en español que conecte los componentes de este kanji con su significado.",
      "Contrasta este kanji con otro que se parece mucho visualmente y dime cómo no confundirlos.",
      "¿Por qué un mismo kanji puede tener varias lecturas on'yomi? Explícamelo de forma sencilla.",
      "Dame tres palabras que combinen este kanji con otros y dime qué lectura toma en cada combinación.",
      "¿Qué errores típicos cometemos los hispanohablantes con el orden de trazos y cómo evitarlos?",
      "Este kanji aparece solo y luego dentro de una palabra compuesta: ¿cómo sé qué lectura corresponde en cada caso?",
      "Explícame qué es un componente fonético dentro de un kanji y si este kanji tiene uno que delate su lectura.",
      "¿Qué relación tienen los radicales con el número de trazos y cómo cuento bien los trazos de este kanji?",
      "Proponme una frase corta en japonés usando este kanji con su lectura kun'yomi para que la practique.",
      "Háblame del origen o la historia de este kanji y de cómo su forma antigua explica su trazado actual.",
      "Compara la lectura on'yomi de este kanji con la pronunciación china original de la que viene, en términos sencillos.",
      "Agrúpame varios kanji que compartan este mismo componente y dime si ese componente da pistas sobre su lectura o significado."
    ]
  },
  {
    "name": "Kana e iniciación: hiragana, katakana, dakuten, combinaciones, romaji",
    "prompts": [
      "Explícame de forma sencilla qué es esta sílaba y cómo se pronuncia para un hispanohablante.",
      "¿Cuál es la diferencia entre el hiragana y el katakana, y cuándo se usa cada uno en japonés?",
      "Dame un truco o mnemotecnia para no olvidar la forma de este caracter de kana.",
      "¿Qué hace exactamente el dakuten y el handakuten, y cómo cambian el sonido de un kana?",
      "Compara este kana con otro que se le parezca visualmente para que no los confunda al leer.",
      "¿Cómo se forman las combinaciones con ya, yu, yo pequeñas (yoon) y cómo se leen?",
      "Conviérteme esta lectura a romaji y explícame con qué sistema de romanización lo haces.",
      "¿Qué errores de pronunciación cometemos los hispanohablantes con las vocales y sílabas japonesas?",
      "Dame tres palabras sencillas escritas solo en hiragana para practicar la lectura de este sonido.",
      "¿Para qué sirve la tsu pequeña (sokuon) y cómo afecta a la pronunciación de la palabra?",
      "¿En qué se diferencian los sonidos de la fila de ra (ra, ri, ru, re, ro) de la 'r' del español?",
      "Dame una estrategia eficaz para memorizar todo el silabario hiragana en pocos días.",
      "¿Cómo se alargan las vocales en katakana con la barra larga y por qué importa hacerlo bien?",
      "Ponme un ejemplo de palabra extranjera escrita en katakana y explícame por qué se escribe así.",
      "Corrígeme: si leo esta sílaba como en español, ¿en qué me estoy equivocando exactamente?",
      "¿Por qué los niños y principiantes en Japón aprenden primero el hiragana y qué papel cultural tiene?",
      "Explícame por qué wo, ha y he se pronuncian distinto cuando funcionan como partículas.",
      "¿Cómo distingo al escuchar entre sílabas parecidas como tsu y su, o shi y chi?"
    ]
  },
  {
    "name": "Acento tonal y pronunciación: contorno, mora, sonidos difíciles",
    "prompts": [
      "Explícame el patrón de acento tonal de esta palabra y por qué la altura sube o baja donde lo hace.",
      "¿Qué es una mora y en qué se diferencia de una sílaba? Usa esta palabra como ejemplo para contarlas.",
      "¿Cómo cambia el significado entre dos palabras que se escriben igual pero tienen distinto acento tonal? Dame un par clásico.",
      "Marca con flechas el contorno de altura de esta lectura, mora por mora, para que sepa dónde sube y dónde baja.",
      "¿Por qué a los hispanohablantes nos cuesta tanto el acento tonal japonés si en español ya usamos acento? Explica la diferencia.",
      "¿Esta palabra tiene una caída de tono? Si la tiene, dime exactamente después de qué mora ocurre.",
      "Dame un truco o asociación para memorizar el patrón de acento de esta palabra sin tener que repasarla mil veces.",
      "¿Cómo pronuncio la R japonesa? Explícame en qué se parece y en qué se diferencia del sonido entre 'pero' y la L del español.",
      "¿Cuál es la diferencia de duración entre una vocal corta y una larga en japonés, y cómo afecta a esta palabra el alargarla de más?",
      "¿Cómo se pronuncia la consonante doble (sokuon) de esta palabra? Dame consejos para hacer esa pausa sin meter una vocal.",
      "¿Qué es el ensordecimiento de vocales y por qué la 'u' o la 'i' a veces casi no se oye? Dame ejemplos de cuándo pasa.",
      "¿Cómo diferencio de oído la 'tsu' de la 'su' y la 'shi' de la 'chi'? Dame ejercicios para entrenar el oído.",
      "¿Cómo suena la 'n' silábica al final de mora y por qué cambia según la letra que viene después?",
      "¿Esta palabra y otra parecida se distinguen solo por el acento o por una vocal larga? Contrástalas para no confundirlas.",
      "¿Cómo afecta el acento tonal a la frase completa, no solo a la palabra suelta? Explica qué pasa al unir palabras y partículas.",
      "Dame frases cortas para practicar en voz alta el contorno de altura de esta palabra dentro de una oración natural.",
      "¿Qué errores típicos de pronunciación delatan a un hispanohablante hablando japonés y cómo los corrijo?",
      "¿Importa de verdad el acento tonal para que me entiendan, o es algo opcional? Explícame cuánto vale la pena enfocarme en esto."
    ]
  },
  {
    "name": "Gramática: estructura de la frase, orden, formas y construcciones",
    "prompts": [
      "Muéstrame el orden básico de una frase japonesa (sujeto, objeto, verbo) y compáralo con cómo lo diría en español.",
      "¿Cómo conviertes esta palabra en su forma negativa y en su forma pasada de manera correcta?",
      "Dame tres frases de ejemplo cortas que usen esta palabra en distintas estructuras gramaticales.",
      "¿Cuál es la diferencia entre la forma desu/masu y la forma plana, y cuándo debo usar cada una?",
      "¿Qué error típico cometemos los hispanohablantes al colocar el verbo al final de la frase, y cómo evitarlo?",
      "Explícame de forma simple a qué grupo de verbos pertenece este verbo y cómo afecta a sus conjugaciones.",
      "¿Cómo pediría algo educadamente usando una construcción con esta palabra en una situación real?",
      "Dame un truco para recordar el orden de las partículas dentro de la frase sin confundirme.",
      "¿Cómo uno dos frases en una sola usando la forma te del verbo, con un ejemplo paso a paso?",
      "Contrasta cómo se expresa la posesión o la pertenencia en japonés frente al español con la partícula no.",
      "Construye una pregunta natural en japonés a partir de esta palabra y explícame qué cambia respecto a la afirmación.",
      "¿Qué diferencia hay entre expresar deseo con tai y pedir un favor, y cómo se estructura cada uno?",
      "¿Por qué en japonés se omite tanto el sujeto y cómo sé cuándo es seguro hacerlo sin perder claridad?",
      "Corrígeme esta idea: si quiero decir una frase con esta palabra, ¿dónde suelo equivocarme con el orden o las partículas?",
      "Explícame cómo funcionan los contadores y dónde se colocan dentro de la frase al contar objetos.",
      "¿Cómo transformo una frase afirmativa en condicional usando to, ba o tara, y cuándo conviene cada forma?",
      "¿Cómo funciona la estructura para modificar un sustantivo con toda una frase delante, como hacen los japoneses?",
      "¿Cómo expreso que algo está ocurriendo ahora mismo o es un estado continuo, y cómo se construye esa forma?"
    ]
  },
  {
    "name": "Partículas: は/が, を, に/で, へ, と, から/まで, の, etc. (preguntas sobre su función)",
    "prompts": [
      "Explícame de forma sencilla cuál es la diferencia entre las partículas wa y ga y cuándo se usa cada una.",
      "En esta frase, ¿por qué se usa la partícula ga y no wa? Analiza el contexto.",
      "¿Qué función exacta cumple la partícula wo en esta oración y por qué va justo ahí?",
      "Aclárame la diferencia entre ni y de cuando ambas parecen traducirse como 'en' en español.",
      "Dame tres ejemplos de oraciones cortas donde ni marque destino o lugar, y explícame cada uno.",
      "¿Cuál es la diferencia entre las partículas e y ni para indicar dirección o destino?",
      "¿Para qué sirve la partícula to y cuántos usos distintos tiene? Dame un ejemplo de cada uno.",
      "Explícame cómo funcionan juntas las partículas kara y made para expresar 'desde' y 'hasta'.",
      "¿Qué hace exactamente la partícula no y por qué a veces conecta dos sustantivos como si fuera 'de'?",
      "Dame un truco o mnemotecnia para no olvidar que wo marca el objeto directo de la acción.",
      "Corrígeme: si quiero decir que voy a la escuela, ¿uso ni o e con la palabra escuela? ¿Y por qué?",
      "Compara wa y wo en una misma oración: ¿qué papel tiene cada partícula y por qué no se confunden?",
      "¿Cuál es el error más común que cometemos los hispanohablantes al elegir entre wa y ga?",
      "Proponme un ejercicio rápido para practicar la elección entre ni y de con lugares y acciones.",
      "¿Por qué el japonés pone la partícula después de la palabra y no antes, como las preposiciones en español?",
      "¿Qué pasa con el significado de una frase si cambio la partícula de por ni? Dame un ejemplo del cambio.",
      "¿Cuándo se puede omitir una partícula en japonés hablado y por qué suena natural hacerlo?",
      "Hazme tres preguntas tipo test para comprobar si entiendo cuándo usar wa frente a ga."
    ]
  },
  {
    "name": "Verbos y adjetivos: grupos, conjugación, te-form, formas casual/cortés, transitivo/intransitivo",
    "prompts": [
      "¿A qué grupo verbal pertenece este verbo (godan, ichidan o irregular) y cómo lo reconozco para conjugarlo bien?",
      "Muéstrame la te-form de este verbo paso a paso y explícame qué regla de sonido se aplica según su terminación.",
      "¿Cómo paso esta palabra de su forma de diccionario a la forma cortés en -masu, y cómo se ve en pasado y en negativo?",
      "Explícame la diferencia entre la versión transitiva y la intransitiva de este verbo y dame una situación donde usaría cada una.",
      "Este es un adjetivo: ¿es de tipo -i o de tipo -na, y cómo cambia su conjugación en negativo y en pasado según ese tipo?",
      "Dame un truco o regla mnemotécnica para no confundir los verbos godan con los ichidan que terminan en -eru o -iru.",
      "Conjuga este verbo en sus formas clave (presente, pasado, negativo, te-form) y dame una frase de ejemplo natural con cada una.",
      "¿En qué contextos sociales debo usar la forma casual de este verbo y cuándo sería una falta de respeto no usar la forma cortés?",
      "Crea una frase corta y cotidiana usando este verbo en te-form para encadenar dos acciones, y tradúcemela.",
      "Como hispanohablante suelo traducir 'ser' y 'estar' al japonés con el mismo verbo: ¿qué errores típicos cometo y cómo los evito?",
      "Corrige esta conjugación que escribí y dime exactamente en qué regla me equivoqué.",
      "¿Por qué algunos adjetivos en español se vuelven verbos o adjetivos -na en japonés, y cómo sé qué construcción usar con esta palabra?",
      "Compara la negación de un verbo (-nai) con la negación de un adjetivo -i y muéstrame por qué se parecen pero no son iguales.",
      "¿Cómo uso este verbo para hacer una petición cortés en te-form (estilo 'por favor, haz...') y qué tono transmite?",
      "Explícame cuándo un adjetivo -i actúa casi como un verbo y por qué no necesita el verbo 'ser' para formar una oración.",
      "Dame tres verbos que se confundan fácilmente con este por su significado parecido y muéstrame qué los distingue en el uso real.",
      "¿Cómo expreso 'puedo hacer' o la forma potencial de este verbo, y cómo cambia según su grupo?",
      "Quiero practicar producción: hazme una pregunta para que yo conjugue este verbo en pasado cortés y luego corrígeme."
    ]
  },
  {
    "name": "Cortesía, keigo y registro social: formal vs casual, cuándo usar cada uno",
    "prompts": [
      "Explícame de forma sencilla qué es el keigo y por qué es tan importante en japonés.",
      "¿Cuál es la diferencia entre el lenguaje formal (teineigo con desu/masu) y el casual, y cómo decido cuál usar?",
      "Explícame la diferencia entre sonkeigo (lenguaje de respeto) y kenjougo (lenguaje humilde), con la idea clave de cada uno.",
      "¿Cómo cambiaría esta palabra o esta frase si tuviera que decírsela a mi jefe en lugar de a un amigo?",
      "Dame el equivalente casual y el equivalente formal de esta expresión para ver el contraste lado a lado.",
      "¿Con quién debería usar desu/masu y con quién puedo hablar en estilo casual sin sonar grosero?",
      "¿Cómo suena esta frase a oídos japoneses: demasiado formal, demasiado directa o adecuada para la situación?",
      "Ayúdame a pedir un favor de forma educada usando esta palabra, como lo haría en una situación de trabajo.",
      "¿Qué errores de cortesía cometemos los hispanohablantes al pasar del tú/usted del español al sistema de registro japonés?",
      "¿Es un error mezclar formas formales y casuales en la misma conversación? Explícame por qué se nota.",
      "Dámelo en tres niveles: cómo se lo diría a un amigo, a un compañero y a un cliente o superior.",
      "¿Qué pasa si uso keigo con un amigo cercano? ¿Puede sonar frío o distante en lugar de educado?",
      "Dame un truco o regla mental para recordar cuándo toca sonkeigo y cuándo toca kenjougo sin confundirlos.",
      "¿Cómo se relaciona el concepto de uchi (dentro) y soto (fuera del grupo) con el nivel de cortesía que debo usar?",
      "En una tienda o restaurante en Japón, ¿qué registro escucharé del personal y cómo debería responder yo educadamente?",
      "Corrígeme si esta frase suena demasiado brusca y dime cómo suavizarla para una situación formal.",
      "¿Qué fórmulas de cortesía básicas (saludos, disculpas, agradecimientos) debería dominar primero antes de meterme en keigo avanzado?",
      "¿Cómo puedo practicar el cambio de registro en mi cabeza para que me salga natural en una conversación real?"
    ]
  },
  {
    "name": "Palabras y formas parecidas: diferencias y cuándo elegir cada una",
    "prompts": [
      "¿En qué se diferencian las dos palabras japonesas que más se parecen a esta y cuándo elijo cada una?",
      "¿Hay otra palabra japonesa con un significado muy cercano a esta? Explícame el matiz que las separa.",
      "Esta palabra y su sinónimo más común, ¿se usan en los mismos contextos o cambia el registro?",
      "Dame un ejemplo donde esta palabra sería correcta y otro donde habría que usar su sinónimo más parecido.",
      "¿Qué error suelen cometer los hispanohablantes al confundir esta palabra con otra muy similar?",
      "Necesito un truco para no confundir esta palabra con la que se le parece tanto. ¿Me das una mnemotecnia?",
      "Si tuviera que elegir entre esta palabra y una más formal con el mismo sentido, ¿cuál uso al hablar con un amigo?",
      "¿Cuál es la diferencia entre el verbo de esta tarjeta y un verbo casi sinónimo? Ponme un par de ejemplos.",
      "Esta palabra, ¿es más coloquial o más neutral que su equivalente más cercano?",
      "Explícame la diferencia entre shiru y wakaru con ejemplos claros de cuándo usar cada uno.",
      "¿Cuándo se usa omou y cuándo kangaeru? Me cuesta distinguirlos al hablar.",
      "Hazme una pregunta rápida para comprobar si sé elegir entre esta palabra y su sinónimo más parecido.",
      "Tengo dos palabras japonesas que traduzco igual al español pero los nativos las usan distinto. ¿Cómo aprendo a separarlas?",
      "Corrígeme: si uso esta palabra en una situación formal, ¿queda raro o existe una variante más apropiada?",
      "¿Por qué a veces el japonés tiene varias palabras para algo que en español decimos con una sola, y cómo escojo?",
      "Dame tres pares de palabras japonesas que los estudiantes confunden a menudo y la clave para distinguir cada par.",
      "¿Cuál es la diferencia entre dos verbos japoneses que ambos se traducen como 'ponerse' o 'llevar' ropa, según la prenda?",
      "¿Qué diferencia hay entre las palabras para 'ir' y 'venir' en japonés y cómo elijo según el punto de vista?"
    ]
  },
  {
    "name": "Frases y producción: pedir ejemplos, variar, reformular, construir oraciones propias",
    "prompts": [
      "Dame tres oraciones de ejemplo con esta palabra, de la más sencilla a la más avanzada.",
      "Usa esta palabra en una conversación corta y natural entre dos personas.",
      "Escribe una frase con este kanji que se entienda en un contexto cotidiano.",
      "Tengo esta idea en español: ayúdame a decirla en japonés usando esta palabra.",
      "Voy a escribir una oración con esta palabra y quiero que me la corrijas si tiene errores.",
      "Reformula esta frase para que suene más natural en boca de un nativo.",
      "Dame la misma oración en tres niveles de formalidad: casual, neutra y formal.",
      "Muéstrame cómo cambia esta frase al pasarla a pregunta y a negativa.",
      "Quiero practicar producción: dame una situación y reto a construir una frase con esta palabra.",
      "Convierte esta frase en pasado y luego en futuro para ver cómo se transforma.",
      "Dame ejemplos de esta palabra acompañada de las palabras con las que suele aparecer.",
      "Escribe un mini-diálogo de tres líneas donde yo tenga que responder usando esta palabra.",
      "Dime cuál es la forma más común de pedir algo educadamente y dame un ejemplo que pueda usar hoy.",
      "Tomo esta frase y quiero variarla cambiando el sujeto y el objeto: dame varias versiones.",
      "Dame una frase larga con esta palabra y luego enséñame a partirla en frases más simples.",
      "Quiero sonar más natural al hablar: dame muletillas y expresiones de relleno con un ejemplo de cada una.",
      "Propón un ejercicio donde yo complete los huecos de una oración usando esta palabra.",
      "Dame una frase con esta palabra y luego pregúntame cómo la diría yo de otra manera para practicar parafraseo."
    ]
  },
  {
    "name": "Errores típicos de hispanohablantes aprendiendo japonés",
    "prompts": [
      "¿Cuál es el error más típico que cometemos los hispanohablantes con esta palabra y cómo lo evito?",
      "Como mi idioma es el español, ¿qué sonido de esta lectura voy a pronunciar mal sin darme cuenta y cómo lo corrijo?",
      "Tendemos a confundir la 'r' japonesa de esta lectura con la 'r' o la 'l' del español. ¿Cómo articulo bien ese sonido?",
      "En español no alargamos las vocales, así que ignoro las vocales largas y las consonantes dobles. ¿Por qué cambian el significado y cómo las distingo al oír?",
      "¿Qué falso amigo o calco del español me haría usar mal esta palabra? Dame el malentendido y la forma correcta.",
      "Quiero decir esta frase 'traduciendo' desde el español. Enséñame por qué eso suena raro en japonés y cómo se diría de forma natural.",
      "¿Por qué los hispanohablantes solemos meter un sujeto explícito tipo 'yo' o 'tú' donde el japonés lo omite? Muéstramelo con esta frase.",
      "El orden sujeto-objeto-verbo me cuesta porque en español ponemos el verbo en medio. Dame un truco para reordenar esta frase sin pensarlo.",
      "¿Qué partícula confundo más fácilmente al traducir esta frase desde el español, por ejemplo wa frente a ga o ni frente a de?",
      "En español usamos el género gramatical y el plural todo el tiempo. ¿Qué errores me provoca eso en japonés y cómo me reeduco?",
      "¿Qué nivel de cortesía pide esta frase? Tengo miedo de sonar demasiado informal o demasiado rígido como nos pasa a los principiantes.",
      "Dame una regla sencilla para no equivocarme al elegir entre la lectura on'yomi y kun'yomi de este kanji, que es donde más me trabo.",
      "Compárame este par de palabras que los hispanohablantes solemos usar como si fueran intercambiables y explícame cuándo va cada una.",
      "Estoy entonando esta lectura con el patrón de acento del español. ¿Cómo me está traicionando el oído y qué hago para captar el acento tonal japonés?",
      "Invéntame un mnemónico en español para no volver a confundir esta palabra con la que siempre la mezclo.",
      "Corrige este error que sé que cometo: uso desu/masu en todo sin saber cuándo en realidad toca el japonés casual. ¿Cuándo cambio de registro?",
      "¿Qué gesto, silencio o convención cultural malinterpretamos los hispanohablantes en una conversación japonesa por dar por hecho lo nuestro?",
      "Hazme un repaso de los tres errores que más cometen los principiantes hispanohablantes en general y dime cómo entrenar para dejar de cometerlos."
    ]
  },
  {
    "name": "Mnemotecnia, memoria y repaso espaciado: cómo fijar esta tarjeta",
    "prompts": [
      "Créame una mnemotecnia visual y memorable en español para fijar esta palabra de una vez.",
      "No consigo recordar esta lectura: dame un truco para asociarla con algo que ya conozco.",
      "¿Por qué se me olvida este kanji justo después de repasarlo y cómo lo evito?",
      "¿Qué es exactamente la repetición espaciada y por qué funciona mejor que repasar muchas veces seguidas?",
      "Diferencia entre repaso pasivo (releer) y repaso activo (recordar de memoria): ¿cuál me conviene con esta tarjeta?",
      "Acabo de fallar esta tarjeta: ¿qué debería hacer ahora para que se me grabe mejor la próxima vez?",
      "Invéntame una historia corta y absurda que conecte la forma, la lectura y el significado de este kanji.",
      "¿Cómo uso la técnica de los loci o palacio de la memoria para varias palabras nuevas como esta?",
      "Esta palabra se parece a otra que ya estudié y las confundo: ¿cómo las separo en mi memoria?",
      "Dame una frase de ejemplo fácil de recordar para anclar esta palabra a un contexto concreto.",
      "¿Cuándo debería volver a ver esta tarjeta para que el repaso espaciado sea eficaz y no me agote?",
      "¿Es buena idea fijar el significado y la lectura por separado, o conviene memorizarlos juntos?",
      "¿Cómo hago una mnemotecnia para esta lectura aprovechando que suena parecido a una palabra en español?",
      "¿Qué hago con las tarjetas que siempre fallo: las repaso aparte o cambio de estrategia?",
      "¿Por qué recordar con esfuerzo (aunque tarde y dude) fija mejor la memoria que ver la respuesta enseguida?",
      "Esta tarjeta tiene sonido e imagen: ¿cómo combino vista, oído y escritura para memorizarla mejor?",
      "¿Hay alguna costumbre o método de estudio típico en Japón que me sirva para fijar vocabulario como este?",
      "Convierte este kanji en un dibujo mental con sus partes como personajes para no olvidarlo nunca."
    ]
  },
  {
    "name": "Cultura, contexto real y pragmática: cómo suena, cuándo se dice, matices sociales",
    "prompts": [
      "¿Esta expresión es más bien formal, neutra o coloquial? ¿Con quién puedo usarla sin quedar mal?",
      "¿Hay una forma más educada o más casual de decir esto según con quién hable?",
      "Dame un ejemplo de una conversación cotidiana donde alguien usaría esta palabra de forma natural.",
      "¿Esta frase suena natural para un japonés o delata que es japonés de libro de texto?",
      "¿Qué matiz social o emocional añade esta expresión que no se ve solo en la traducción?",
      "Si le digo esto a mi jefe o a alguien mayor, ¿resulta grosero o está bien? ¿Cómo lo suavizo?",
      "¿Qué error de tono o registro suele cometer un hispanohablante al usar esta palabra?",
      "Explícame la diferencia cultural detrás de esta expresión que no tiene equivalente directo en español.",
      "¿Cómo se relaciona esta palabra con el honne y el tatemae o con evitar la confrontación directa?",
      "¿En qué contexto se considera de mala educación decir esto tan directamente en Japón?",
      "¿Qué diría un japonés en lugar de traducir literalmente esta frase del español?",
      "¿Esta palabra se usa más entre amigos, en el trabajo, o en situaciones formales?",
      "Cuéntame algún malentendido cultural típico que provoca esta expresión entre extranjeros y japoneses.",
      "¿Cómo cambia el significado o el tono de esta frase según la entonación o el contexto?",
      "¿Qué gesto, costumbre o etiqueta acompaña normalmente a esta expresión en la vida real?",
      "¿Por qué los japoneses suelen dejar esta frase a medias o sin terminar, y cómo lo interpreto?",
      "¿Qué papel tienen las expresiones de cortesía fijas (como las de antes y después de comer) en el día a día japonés?",
      "¿Hay alguna referencia generacional o de moda en esta palabra que la haga sonar joven, anticuada o de internet?"
    ]
  },
  {
    "name": "Método de estudio y uso de Akari: rachas, repaso, kana/kanji/acento, motivación",
    "prompts": [
      "¿Qué significa exactamente la 'racha' en Akari y por qué es tan importante para aprender japonés?",
      "Si pierdo mi racha de estudio, ¿perdí todo mi progreso o solo el contador? Explícame qué pasa con mis tarjetas.",
      "¿Qué diferencia hay entre 'repaso' y 'aprender tarjetas nuevas', y a cuál debería dar prioridad cada día?",
      "¿Cómo funciona la repetición espaciada y por qué a veces una tarjeta reaparece muy pronto y otras veces tarda semanas?",
      "Tengo muchos repasos atrasados y me agobio. Dame un plan concreto para ponerme al día sin rendirme.",
      "¿En qué orden me conviene atacar Akari como principiante: kana, kanji, vocabulario o acento? Justifica el orden.",
      "¿Es mejor estudiar 10 minutos cada día o una hora dos veces por semana? Qué dice la evidencia sobre el repaso diario.",
      "Dame una rutina realista de 15 minutos al día para combinar repaso, kana y un drill sin quemarme.",
      "¿Cuándo debo pasar del reconocimiento de kana a los drills de escritura y al sprint de 60 segundos? Cómo sé que ya domino el kana.",
      "¿Qué es el acento tonal (pitch accent) y por qué vale la pena practicarlo desde el principio en vez de dejarlo para después?",
      "Dame una técnica para no olvidar mantener la racha aunque tenga un día ocupado o esté de viaje.",
      "Cuando una tarjeta se me resiste y la fallo una y otra vez, ¿qué estrategia uso para que por fin se me quede?",
      "¿Qué errores típicos cometemos los hispanohablantes al estudiar japonés con flashcards y cómo los evito en Akari?",
      "¿Es contraproducente adelantar muchas tarjetas nuevas de golpe? Explícame el equilibrio entre avanzar y consolidar.",
      "¿Cómo uso la página de estadísticas de Akari para detectar mis puntos débiles y ajustar mi estudio?",
      "Pierdo la motivación después de unas semanas. Dame consejos para sostener el hábito a largo plazo y celebrar pequeños logros.",
      "¿Cuánto vocabulario o cuántos kanji es realista aprender por día en Akari sin saturar mis repasos futuros?",
      "¿Cómo combino el shadowing de audio con el repaso de tarjetas para mejorar también mi pronunciación?"
    ]
  }
];

// Themes that read well as a quick suggestion when a vocab/kanji card is in context.
// Kana-intro (index 3) and pure study-method (index 14) prompts stay in the library
// but are not surfaced as per-card suggestions.
const CHIP_POOL: string[] = SENSEI_PROMPTS.filter((_, i) => i !== 3 && i !== 14).flatMap((c) => c.prompts);

/** A few varied suggested questions for the Sensei panel, shuffled so the user keeps
 *  discovering different ones. Pure UI strings — no Japanese content is generated. */
export function suggestedSenseiPrompts(count = 4): string[] {
  const a = CHIP_POOL.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(count, a.length));
}
