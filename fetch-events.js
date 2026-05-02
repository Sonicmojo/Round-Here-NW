name: Fetch Events Daily
on:
  workflow_dispatch:
  schedule:
    - cron: "0 6 * * *"
jobs:
  fetch-events:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Fetch and save events
        env:
          DATATHISTLE_TOKEN: ${{ secrets.DATATHISTLE_TOKEN }}
        run: |
          node -e "
          const https=require('https'),fs=require('fs'),T=process.env.DATATHISTLE_TOKEN;
          const AREAS=[{lat:51.5465,lon:-0.1908,postcode:'NW6'},{lat:51.5354,lon:-0.2312,postcode:'NW10'},{lat:51.5563,lon:-0.2148,postcode:'NW2'}];
          const EMOJI={Music:'🎵',Film:'🎬',Theatre:'🎭',Comedy:'😂',Kids:'👶','Days Out':'🌿',Sport:'⚽','Food and Drink':'🍽',Dance:'💃','Visual Art':'🎨',Clubs:'🎧',Books:'📚','Talks and Lectures':'🗣',Workshops:'🔧'};
          const BG={Music:'#EDE9FE',Film:'#FEE2E2',Theatre:'#FCE7F3',Comedy:'#FEF9C3',Kids:'#CFFAFE','Days Out':'#DCFCE7',Sport:'#D1FAE5','Food and Drink':'#FEF3C7',Dance:'#FCE7F3','Visual Art':'#FCE7F3',Clubs:'#EDE9FE',Books:'#DBEAFE','Talks and Lectures':'#DBEAFE',Workshops:'#D1FAE5'};
          const CAT={Music:'music',Film:'arts',Theatre:'arts',Comedy:'community',Kids:'kids','Days Out':'outdoors',Sport:'sport','Food and Drink':'food',Dance:'arts','Visual Art':'arts',Clubs:'music',Books:'community','Talks and Lectures':'community',Workshops:'community'};
          function get(url){return new Promise((resolve,reject)=>{https.get(url,{headers:{Authorization:'Bearer '+T}},(res)=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>resolve(JSON.parse(d)));}).on('error',reject);})}
          async function main(){
            const all=[];
            for(const area of AREAS){
              const url='https://api.datathistle.com/v1/events?lat='+area.lat+'&lon='+area.lon+'&distance=2';
              console.log('Fetching '+area.postcode+'...');
              try{
                const data=await get(url);
                const events=(Array.isArray(data)?data:[]).map(ev=>({
                  id:ev.id||Math.random().toString(36),
                  title:ev.name||ev.title||'',
                  cat:CAT[ev.category]||'community',
                  postcode:area.postcode,
                  venue:ev.place?.name||ev.venue?.name||'Venue TBC',
                  date:ev.date||ev.start_time||'',
                  dateKey:'month',
                  url:ev.url||ev.booking_url||null,
                  isFree:ev.is_free||false,
                  emoji:EMOJI[ev.category]||'📅',
                  bg:BG[ev.category]||'#DBEAFE',
                  lat:ev.place?.lat||ev.lat||null,
                  lng:ev.place?.lon||ev.lon||null
                }));
                console.log(events.length+' events in '+area.postcode);
                all.push(...events);
              }catch(e){console.error('Failed '+area.postcode+':',e.message);}
            }
            const seen=new Set();
            const unique=all.filter(e=>seen.has(e.id)?false:seen.add(e.id));
            fs.writeFileSync('events.json',JSON.stringify({lastUpdated:new Date().toISOString(),totalEvents:unique.length,events:unique},null,2));
            console.log('Done! '+unique.length+' events written.');
          }
          main().catch(e=>{console.error(e);process.exit(1)});
          "
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update events"
          file_pattern: events.json
          push_options: '--force'
