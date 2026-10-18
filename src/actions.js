/** Approved activity vocabulary. These are suggestions, never venue facts. */
export const ACTIONS = {
 cafe:[['coffee_pause','Take a slow coffee break and watch the city go by.','Сделайте паузу за кофе и понаблюдайте за городом.','Кофе ішіп, қала тіршілігін тамашалаңыз.'],['ask_socket','Before ordering, ask whether a socket and a quiet seat are available.','Перед заказом уточните, есть ли розетка и тихое место.','Тапсырыс бермес бұрын розетка мен тыныш орын барын сұраңыз.']],
 restaurant:[['meal','Pause for a meal; check the menu and prices on arrival.','Сделайте остановку на обед; меню и цены уточните на месте.','Тамақтанып алыңыз; мәзір мен бағаны сол жерде тексеріңіз.']],
 museum:[['one_exhibit','Choose one exhibition to explore at your own pace; confirm access first.','Выберите одну экспозицию и осмотрите её без спешки; уточните доступ.','Бір көрмені асықпай тамашалаңыз; алдымен кіру мүмкіндігін тексеріңіз.'],['curiosity','Pick one object and discuss what surprised you about it.','Выберите один экспонат и обсудите, что вас удивило.','Бір жәдігерді таңдап, несімен таңғалдырғанын талқылаңыз.']],
 park:[['slow_loop','Take a short loop along visible public paths and pause to notice the surroundings.','Пройдите небольшой круг по общедоступным дорожкам и осмотритесь.','Қоғамдық жолдармен шағын айналым жасап, айналаны тамашалаңыз.'],['nature_details','Look for three small details in the landscape that you would usually miss.','Найдите три детали пейзажа, которые обычно не замечаете.','Әдетте байқамайтын үш табиғат көрінісін табыңыз.']],
 playground:[['play_break','Plan a supervised play break; check the equipment on arrival.','Запланируйте игру под присмотром; проверьте оборудование на месте.','Бақылаумен ойнауға уақыт бөліңіз; жабдықты сол жерде тексеріңіз.']],
 mall:[['indoor_break','Take an indoor break and check the directory for an activity that suits you.','Сделайте остановку в помещении и выберите занятие по указателям.','Ғимаратта демалып, нұсқаулықтан қолайлы іс табыңыз.']],
 library:[['reading','Ask about visitor access, then settle into a short reading break.','Уточните правила посещения и выделите немного времени на чтение.','Кіру ережесін сұрап, аздап кітап оқыңыз.']],
 default:[['notice_architecture','Notice the shapes, materials and details; try a photo from a public viewpoint.','Рассмотрите формы и детали; сделайте фото из общедоступного места.','Пішіндер мен бөлшектерге назар аударып, қоғамдық жерден фото түсіріңіз.'],['take_a_pause','Take a short pause and explore the public surroundings at your own pace.','Сделайте короткую паузу и осмотрите общедоступную территорию.','Аздап демалып, қоғамдық аумақты асықпай аралаңыз.']],
};
export function allowedActions(p){return ACTIONS[p.category==='garden'?'park':p.category]||ACTIONS.default;}
export function actionText(p,locale='en',id){const list=allowedActions(p);return (list.find(a=>a[0]===id)||list[0])[{en:1,ru:2,kk:3}[locale]||1];}
export function validateGeneration(value,pois){
 if(!value||!Array.isArray(value.suggestions)||value.suggestions.length!==pois.length)throw new Error('Invalid model response shape');
 const seen=new Set();
 return value.suggestions.map(s=>{const p=pois.find(p=>p.id===s.id);if(!p||seen.has(s.id)||!allowedActions(p).some(a=>a[0]===s.actionId))throw new Error('Unsupported model recommendation');seen.add(s.id);return {id:s.id,actionId:s.actionId};});
}
