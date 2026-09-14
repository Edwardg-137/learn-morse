export interface Lesson {
  id: string;
  title: string;
  description: string;
  stage: string;
  symbols: string;
  explanation: string;
  examples: string[];
  exercises: string[];
  infinite?: boolean;
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ';
const repertoire = `${alphabet}0123456789.,?`;

/** All teaching copy and exercise passages were written originally for Learn Morse. */
export const lessons: Lesson[] = [
  {
    id: 'primer-pulso', title: 'Tu primer pulso', stage: 'Introducción', symbols: 'ET',
    description: 'Conoce el punto, la raya y el silencio.',
    explanation: 'Pulsa Espacio brevemente para E, un punto. Mantén para T, una raya. En reproducción una raya dura tres puntos. Deja una pausa para confirmar la letra y una pausa mayor para separar palabras. Escucha los dos ejemplos y transmítelos después. Puedes ajustar los tiempos en la práctica.',
    examples: ['E', 'T'], exercises: ['E', 'T', 'ET', 'TE'],
  },
  {
    id: 'letras-e-t-i-m', title: 'El ritmo más sencillo', stage: 'Letras', symbols: 'ETIM',
    description: 'E, T, I y M. Una señal se convierte en dos.',
    explanation: 'E es un punto y T una raya. I son dos puntos y M dos rayas. Mantén breve el silencio dentro de cada letra. Deja tres unidades de silencio entre letras al escuchar el ejemplo. Reconoce el ritmo completo antes de contar señales.',
    examples: ['I', 'M'], exercises: ['E', 'T', 'I', 'M', 'MI', 'TI'],
  },
  {
    id: 'letras-a-n-s-o', title: 'Ritmos que se reflejan', stage: 'Letras', symbols: 'ANSO',
    description: 'A, N, S y O. Cambia el orden y escucha.',
    explanation: 'A combina punto y raya. N invierte ese orden. S son tres puntos y O tres rayas. SOS permite escuchar el contraste, aunque un mensaje real de socorro no es un juego. Practica cada letra y después la combinación sin acelerar.',
    examples: ['A', 'N', 'SOS'], exercises: ['A', 'N', 'S', 'O', 'SOS', 'OSO'],
  },
  {
    id: 'letras-r-k-d-u', title: 'Tres señales, una letra', stage: 'Letras', symbols: 'RKDU',
    description: 'R, K, D y U. Distingue la posición de la raya.',
    explanation: 'R suena punto, raya, punto. K invierte ese patrón. D comienza con raya y termina con dos puntos. U comienza con dos puntos y termina con raya. Escucha cada patrón como una pequeña palabra y repítelo con una sola tecla.',
    examples: ['R', 'K'], exercises: ['R', 'K', 'D', 'U', 'DU', 'UR'],
  },
  {
    id: 'letras-g-w-h-b', title: 'Alarga la secuencia', stage: 'Letras', symbols: 'GWHB',
    description: 'G, W, H y B. Aparecen cuatro señales.',
    explanation: 'G empieza con dos rayas y W termina con dos. H son cuatro puntos. B es una raya y tres puntos. No confirmes la letra antes de completar su patrón. Si necesitas más tiempo entre señales, aumenta el umbral de separación de letras.',
    examples: ['G', 'H'], exercises: ['G', 'W', 'H', 'B', 'GH', 'WB'],
  },
  {
    id: 'letras-v-f-l-p', title: 'Encuentra la raya', stage: 'Letras', symbols: 'VFLP',
    description: 'V, F, L y P. El orden es la clave.',
    explanation: 'V termina en raya después de tres puntos. F sitúa la raya tras dos puntos y L después del primero. P tiene dos rayas entre dos puntos. Compara los ejemplos en recepción y transmite cada variante para fijar el orden.',
    examples: ['V', 'F'], exercises: ['V', 'F', 'L', 'P', 'FL', 'PV'],
  },
  {
    id: 'letras-j-c-y-z', title: 'Combinaciones con carácter', stage: 'Letras', symbols: 'JCYZ',
    description: 'J, C, Y y Z. Completa patrones largos.',
    explanation: 'J comienza con punto y sigue con tres rayas. C alterna raya, punto, raya, punto. Y es raya, punto y dos rayas. Z reúne dos rayas y dos puntos. Escucha sin mirar una vez que puedas reproducirlos con ayuda.',
    examples: ['C', 'Z'], exercises: ['J', 'C', 'Y', 'Z', 'CJ', 'ZY'],
  },
  {
    id: 'letras-q-x', title: 'El alfabeto completo', stage: 'Letras', symbols: alphabet,
    description: 'Q y X cierran el recorrido de A a Z.',
    explanation: 'Q es raya, raya, punto, raya. X tiene dos puntos entre dos rayas. Repasa el alfabeto en ambas direcciones. La Ñ se enseña en la siguiente etapa como una extensión propia del curso y no debe confundirse con N.',
    examples: ['Q', 'X'], exercises: ['Q', 'X', 'QUIZ', 'TAXI', 'EXAMEN'],
  },
  {
    id: 'enie', title: 'Una señal para la Ñ', stage: 'Ampliación', symbols: alphabet,
    description: 'Conserva la Ñ y simplifica las vocales con tilde.',
    explanation: 'Este curso utiliza --.-- para Ñ como convención explícita, separada del repertorio internacional de referencia. N sigue siendo raya y punto. No son intercambiables. Para transmitir, á, é, í, ó, ú y ü se convierten en A, E, I, O, U y U. Las mayúsculas y minúsculas se comparan igual.',
    examples: ['Ñ', 'año', 'pingüino'], exercises: ['Ñ', 'NIÑO', 'MAÑANA', 'SUEÑO', 'PIÑATA'],
  },
  {
    id: 'numeros', title: 'Cuenta hasta diez', stage: 'Ampliación', symbols: `${alphabet}0123456789`,
    description: 'Del 0 al 9 con patrones de cinco señales.',
    explanation: 'Los números siempre tienen cinco señales. Del 1 al 5 aumentan los puntos iniciales y disminuyen las rayas. Del 6 al 0 aumentan las rayas iniciales. El cero son cinco rayas. Separa las cifras como letras, no como palabras independientes.',
    examples: ['12345', '67890'], exercises: ['01234', '56789', '2026', '73', 'RADIO 5'],
  },
  {
    id: 'senales-sueltas', title: 'Señales sueltas', stage: 'Ampliación', symbols: `${alphabet}0123456789`,
    infinite: true,
    description: 'Letras y números individuales al azar, sin fin. Dificultad intermedia.',
    explanation: 'Esta práctica no se agota. Cada ronda muestra una sola letra o un solo número, elegido al azar entre A–Z, Ñ y 0–9. Ya conoces el alfabeto y las cifras de cinco señales: aquí las mezclas una a una, en ambas direcciones, al ritmo que elijas. Completar una señal no cierra la lección; puedes seguir o volver al recorrido cuando quieras. Esta práctica local no concede XP de servidor.',
    examples: ['K', '7', 'Ñ'], exercises: [],
  },
  {
    id: 'puntuacion', title: 'Mensajes con intención', stage: 'Ampliación', symbols: repertoire,
    description: 'Punto, coma e interrogación de cierre.',
    explanation: 'El punto se transmite .-.-.- y la coma --..--. La interrogación combina dos puntos, dos rayas y dos puntos. Cada signo tiene su propio patrón y se separa de la letra anterior igual que otra letra. El signo de apertura ¿ se omite al transmitir. Otros signos se rechazan con un aviso. Compara siempre el original con su versión de transmisión.',
    examples: ['.', ',', '?'], exercises: ['.', ',', '?', '¿SI?', 'HOLA, ANA.'],
  },
  {
    id: 'palabras-cortas', title: 'Palabras que ya conoces', stage: 'Palabras', symbols: alphabet,
    description: 'Une letras en palabras de tres a cinco caracteres.',
    explanation: 'Escucha o mira la palabra completa antes de responder. Dentro de una letra hay una unidad de silencio y entre letras hay tres. Transmite sin añadir espacios entre las letras de una palabra. Repite el segmento cuando lo necesites, conservando tus intentos para ver el progreso.',
    examples: ['SOL', 'LUNA'], exercises: ['MAR', 'CASA', 'LUNA', 'RADIO', 'NIÑA', 'LUZ'],
  },
  {
    id: 'palabras-largas', title: 'Mantén el hilo', stage: 'Palabras', symbols: alphabet,
    description: 'Practica palabras largas y letras menos frecuentes.',
    explanation: 'Divide mentalmente una palabra larga en grupos, pero conserva pausas de letra al transmitirla. Una pausa de palabra prematura cambia la respuesta. Prueba después el modo auditivo y escribe solo cuando hayas escuchado el mensaje. No necesitas igualar la velocidad de reproducción al principio.',
    examples: ['BIBLIOTECA', 'EXPLORAR'], exercises: ['COMUNICACION', 'ZANAHORIA', 'JEROGLIFICO', 'KIWI', 'WEB', 'EXPERIENCIA'],
  },
  {
    id: 'frases', title: 'Deja respirar el mensaje', stage: 'Frases', symbols: repertoire,
    description: 'Oraciones de 5 a 25 palabras con pausas claras.',
    explanation: 'Una pausa de siete unidades separa palabras en la reproducción. En la captura usamos tiempos más amplios, ajustables, para aprender. Espera a confirmar cada palabra y sigue. La puntuación también cuenta. En recepción puedes editar el texto antes de enviarlo, sin penalización por palabras todavía incompletas.',
    examples: ['La radio nos conecta hoy.'],
    exercises: [
      'La radio nos conecta con nuevos amigos.',
      '¿Puedes escuchar el canto de los pájaros esta mañana?',
      'A las 9, Julia enciende su radio y saluda a la estación del valle.',
      'Un punto, una raya y un poco de paciencia nos ayudan a compartir las palabras que antes parecían muy difíciles.',
    ],
  },
  {
    id: 'parrafos', title: 'Una historia en señales', stage: 'Párrafos', symbols: repertoire,
    description: 'Textos de 30 a 150 palabras, por oraciones o completos.',
    explanation: 'Elige segmentos para practicar una oración cada vez o trabaja el texto completo. Lee el objetivo antes de transmitir y escucha antes de escribir en recepción. La precisión usa distancia de edición, por lo que una letra añadida no convierte todas las siguientes en errores. La revisión distingue sustituciones, omisiones e inserciones.',
    examples: ['La práctica constante hace más claro cada mensaje.'],
    exercises: [
      'La biblioteca del barrio abrió una pequeña sala de radio. Cada sábado, niñas y niños aprenden a escuchar antes de transmitir. Sobre la mesa hay un cuaderno para anotar palabras nuevas. Nadie tiene prisa, porque una señal clara vale más que una señal rápida.',
      'El camino sube entre árboles y termina junto a una estación antigua. Allí, Elena observa una fotografía de su abuelo. Él enviaba noticias a los pueblos del valle cuando las lluvias cortaban el paso. Hoy ella aprende esos mismos ritmos y escribe un mensaje sencillo. Gracias por enseñarnos a mantener el contacto.',
      'Durante la feria de ciencias, nuestro grupo preparó una demostración con luces y sonido. Al principio solo transmitimos nombres cortos. Después llegaron preguntas, respuestas y hasta un pequeño cuento. Descubrimos que el silencio también lleva información. Una pausa breve une las señales de una letra y una pausa mayor separa las palabras. Cuando alguien se equivocaba, repetíamos el mensaje con calma. Al final de la tarde, todos habían conseguido enviar al menos una frase completa sin mirar la tabla.',
    ],
  },
  {
    id: 'textos-largos', title: 'La estación de las historias', stage: 'Textos largos', symbols: repertoire,
    description: 'Dos relatos originales para practicar continuidad y resistencia.',
    explanation: 'Estos textos se conservan completos. Puedes avanzar por oraciones, pausar y reanudar tu práctica local, o transmitir de forma continua. Prioriza claridad sobre velocidad y descansa entre segmentos. Revisa los errores de todos los intentos al terminar. En recepción auditiva el objetivo permanece oculto durante el intento. La precisión de cada dirección se practica por separado.',
    examples: ['Cada mensaje comienza con alguien dispuesto a escuchar.'],
    exercises: [
      `La primera vez que Inés visitó el observatorio, pensó que todas las preguntas sobre el cielo tendrían respuestas enormes. Sin embargo, la persona que cuidaba el lugar le entregó un cuaderno pequeño y le pidió que anotara lo que podía ver desde la ventana. Había una nube, dos montañas y una luz que parpadeaba a lo lejos.

      La luz venía de una casa donde vivía un aficionado a la radio. Cada tarde practicaba mensajes breves con una amiga del otro lado del valle. Inés quiso aprender aquel lenguaje y comenzó con su nombre. Al principio confundía las pausas y olvidaba alguna raya. Su maestro le recordó que escuchar era parte de transmitir bien.

      Durante varias semanas repitió palabras, escribió preguntas y celebró cada avance pequeño. Una noche consiguió enviar una frase completa sobre las estrellas que acababa de observar. La respuesta llegó despacio y con claridad. Alguien, desde la otra montaña, también estaba mirando el cielo. Inés comprendió entonces que aprender un código no solo sirve para cambiar letras por señales. También abre una manera nueva de compartir lo que nos asombra.`,
      `En el pueblo de los puentes había una estación de radio que llevaba muchos años cerrada. Sus ventanas miraban hacia el río y una enredadera cubría parte del tejado. Cuando el ayuntamiento decidió convertirla en un espacio de aprendizaje, varias personas ofrecieron su tiempo. Algunas limpiaron las mesas, otras repararon las sillas y un grupo de estudiantes preparó carteles para dar la bienvenida.

      Clara encontró una caja de cuadernos en un armario. No contenían secretos ni tesoros escondidos, sino registros de mensajes cotidianos. Un agricultor avisaba de la llegada de semillas. Una maestra preguntaba por unos libros. Una familia anunciaba que su hija había nacido. Cada página mostraba cómo unas pocas palabras podían unir lugares separados por muchos kilómetros de camino.

      El primer taller reunió a doce vecinos. La persona encargada explicó que el código morse combina señales cortas, señales largas y silencios. Dibujó un punto y una raya, pero pidió que nadie intentara memorizar toda la tabla aquella tarde. Empezaron con dos letras, escucharon sus ritmos y luego cambiaron de papel. Quien había transmitido debía ahora recibir el mensaje de su compañero.

      Hubo risas cuando una palabra se convirtió en otra. Clara escribió luna donde su amigo quería decir lupa. Revisaron juntos la diferencia y descubrieron que una sola señal cambiaba la letra final. El error quedó anotado en el cuaderno como parte del aprendizaje. En el siguiente intento ambos redujeron la velocidad y prestaron más atención a las pausas entre letras.

      Con el paso de las semanas, los ejercicios crecieron. Primero fueron nombres, después frases y finalmente relatos completos. Cada participante podía ajustar los tiempos para sentirse cómodo. Una niña prefería escuchar sin mirar la pantalla. Su abuelo necesitaba ver las señales antes de reconocerlas por el sonido. Ninguno tenía que seguir exactamente el mismo ritmo para aprender junto al otro.

      Una tarde de lluvia prepararon una actividad especial. Cada pareja recibió una historia diferente y debía transmitirla por partes. Al terminar una oración, revisaban la respuesta y descansaban unos segundos. Así evitaron que el cansancio escondiera lo que ya sabían. También descubrieron que terminar deprisa no siempre significaba comunicar mejor. La claridad permitía que la historia conservara todos sus detalles.

      Clara eligió contar el viaje de una semilla desde la montaña hasta el jardín de una escuela. Su compañero escuchó con paciencia y escribió cada fragmento. Cuando llegaron al final, compararon el texto completo. Faltaba una coma y sobraba una letra, pero el recorrido seguía siendo fácil de entender. Repitieron los dos segmentos y guardaron ambos intentos para recordar cuánto habían avanzado.

      Al cerrar la estación, dejaron un cartel junto a la puerta. Invitaba a cualquier persona a entrar, escuchar y probar. Los cuadernos antiguos permanecieron en una estantería, junto a los nuevos. Entre sus páginas convivían noticias del pasado y preguntas del presente. La estación volvía a cumplir su tarea más sencilla, ofrecer un lugar donde alguien pudiera enviar una idea y encontrar al otro lado a alguien dispuesto a recibirla.`,
    ],
  },
];
