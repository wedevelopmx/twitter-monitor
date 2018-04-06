const frequency = require('./data/frequency');
const MonitorService = require('commons').MonitorService;
const Twitter = require('commons').Twitter;
const monitorService = new MonitorService();
const twitterAPI = new Twitter();

console.log(`>> ${new Date()} - Searching for today deputy`);

function frequencyDistribution(deputy, frequency) {
  let below = 0, equals = 0, above = 0;

  frequency.forEach(item => {
    if(deputy.attendances > item.quantity) {
      below += item.frequency;
    } else if(deputy.attendances === item.quantity) {
      equals = item.frequency;
    } else {
      above += item.frequency;
    }
  });

  return { below, equals, above };
}

function quote(distribution) {
  if(distribution.below > 230)
    return `se posiciona en los mejores ${(100 - (distribution.below * 100 / 500)).toFixed(0)}% de la #CamaraDeDiputados #LXIII`;
  return `hay ${500 - distribution.below - distribution.equals} diputados con mejor asistencia en #CamaraDeDiputados #LXIII`;
}

monitorService.findAllDeputies({ type: 'Mayoría Relativa' })
  .then(deputies => {
    let deputy = deputies[0];
    let distribution = frequencyDistribution(deputy, frequency);
    let position = quote(distribution);
    let account = deputy.twitter ? `@${deputy.twitter}`: '';
    let tweet = `Te presentamos a ${deputy.displayName} ${account} diputado del distrito ${deputy.area} de #${deputy.state.replace(' ', '')} #${deputy.party.toUpperCase()}, con ${deputy.attendances}/165 asistencias ${position}, conoce mas sobre tu diputado en #ContactoLegislativo https://contactolegislativo.com/camara-de-diputados/LXIII/${deputy.slug}`;

    console.log(`>> ${tweet}`);
    twitterAPI.tweet(tweet).then(() => {
      deputy.lastPublishedDate = new Date();
      deputy.save(() => {
        console.log(`>> Tweet successfull & deputy saved`);
        monitorService.close();
      });
    });
  })
  .catch(err => console.log(err));