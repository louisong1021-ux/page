const AIRPORT_ADDRESSES={
  LAX:"1 World Way, Los Angeles, CA 90045",
  ONT:"2500 E Airport Dr, Ontario, CA 91761",
  SNA:"18601 Airport Way, Santa Ana, CA 92707",
  LGB:"4100 Donald Douglas Dr, Long Beach, CA 90808",
  BUR:"2627 N Hollywood Way, Burbank, CA 91505"
};
const corsHeaders={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"Content-Type",
  "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
  "Content-Type":"application/json"
};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:corsHeaders});
const round5=n=>Math.ceil(n/5)*5;
async function routeMiles(env,origin,destination){
  if(!env.GOOGLE_MAPS_API_KEY)throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  const r=await fetch("https://routes.googleapis.com/directions/v2:computeRoutes",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "X-Goog-Api-Key":env.GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask":"routes.distanceMeters,routes.duration"
    },
    body:JSON.stringify({origin:{address:origin},destination:{address:destination},travelMode:"DRIVE",routingPreference:"TRAFFIC_UNAWARE"})
  });
  const j=await r.json();
  if(!r.ok||!j.routes?.[0]?.distanceMeters)throw new Error(j.error?.message||"Unable to calculate route");
  return j.routes[0].distanceMeters/1609.344;
}
async function quoteAddress(req,env){
  const b=await req.json();
  const airport=String(b.airport||"").toUpperCase();
  const airportAddress=AIRPORT_ADDRESSES[airport];
  if(!airportAddress||!b.address)return json({error:"address and supported airport are required"},400);
  const oneWay=await routeMiles(env,b.direction==="arrival"?airportAddress:b.address,b.direction==="arrival"?b.address:airportAddress);
  const deadheadFactor=Number(env.DEADHEAD_FACTOR||1.55);
  const rate=Number(env.RATE_PER_BILLABLE_MILE||1.65);
  const minimum=Number(env.MIN_BASE_FARE||70);
  const billableMiles=oneWay*deadheadFactor;
  const baseFare=round5(Math.max(minimum,billableMiles*rate));
  return json({success:true,baseFare,miles:Number(billableMiles.toFixed(2)),routeMiles:Number(oneWay.toFixed(2)),city:b.city||"",pricing:{deadheadFactor,rate,minimum}});
}
async function createBooking(req,env){
  const b=await req.json();
  if(!b.id||!b.name||!b.phone||!b.airport||!b.date)return json({error:"missing required booking fields"},400);
  if(env.BOOKINGS_DB){
    await env.BOOKINGS_DB.prepare("INSERT OR REPLACE INTO bookings (id, created_at, status, name, phone, airport, trip_date, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(b.id,b.createdAt||new Date().toISOString(),b.status||"Pending confirmation",b.name,b.phone,b.airport,b.date,JSON.stringify(b)).run();
  }
  return json({success:true,id:b.id,databaseSaved:!!env.BOOKINGS_DB});
}
async function getBooking(url,env){
  if(!env.BOOKINGS_DB)return json({error:"database not configured"},503);
  const id=url.pathname.split("/").pop();
  const row=await env.BOOKINGS_DB.prepare("SELECT * FROM bookings WHERE id=?").bind(id).first();
  return row?json({success:true,booking:{...row,payload:JSON.parse(row.payload)}}):json({error:"not found"},404);
}
export default{async fetch(req,env){
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders});
  const url=new URL(req.url);
  try{
    if(url.pathname==="/api/address-quote"&&req.method==="POST")return await quoteAddress(req,env);
    if(url.pathname==="/api/bookings"&&req.method==="POST")return await createBooking(req,env);
    if(url.pathname.startsWith("/api/bookings/")&&req.method==="GET")return await getBooking(url,env);
    if(url.pathname==="/health")return json({ok:true});
    return json({error:"not found"},404);
  }catch(e){return json({error:e.message||"server error"},500)}
}};