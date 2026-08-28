const express=require("express");
const path=require("path");
const fs=require("fs");
const crypto=require("crypto");
const multer=require("multer");
const app=express(), PORT=process.env.PORT||3000;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"CHANGE_ME_NOW";
const DB=path.join(__dirname,"data.json");
const upload=multer({dest:path.join(__dirname,"public","uploads"),limits:{fileSize:5*1024*1024}});

function readDB(){try{return JSON.parse(fs.readFileSync(DB,"utf8"))}catch{return {news:[],transfers:[]}}}
function writeDB(d){fs.writeFileSync(DB,JSON.stringify(d,null,2),"utf8")}
function auth(req,res,next){const t=req.headers.authorization||""; if(t==="Bearer "+process.env.ADMIN_TOKEN)return next(); res.status(401).json({error:"غير مصرح"})}
function hash(s){return crypto.createHash("sha256").update(s).digest("hex")}

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

app.post("/api/admin/login",(req,res)=>{
 if(!req.body?.password || req.body.password!==ADMIN_PASSWORD)return res.status(401).json({error:"كلمة المرور غير صحيحة"});
 const token=hash(ADMIN_PASSWORD+"|"+(process.env.ADMIN_TOKEN||""));
 res.json({token});
});

app.get("/api/content",(req,res)=>res.json(readDB()));

app.post("/api/news",auth,upload.single("image"),(req,res)=>{
 const d=readDB(), item={id:Date.now().toString(),title:req.body.title||"",body:req.body.body||"",date:new Date().toISOString(),image:req.file?"/uploads/"+req.file.filename:""};
 d.news.unshift(item); writeDB(d); res.json(item);
});
app.delete("/api/news/:id",auth,(req,res)=>{const d=readDB();d.news=d.news.filter(x=>x.id!==req.params.id);writeDB(d);res.json({ok:true})});

app.post("/api/transfers",auth,upload.single("image"),(req,res)=>{
 const d=readDB(), item={id:Date.now().toString(),player:req.body.player||"",type:req.body.type||"in",details:req.body.details||"",date:new Date().toISOString(),image:req.file?"/uploads/"+req.file.filename:""};
 d.transfers.unshift(item); writeDB(d); res.json(item);
});
app.delete("/api/transfers/:id",auth,(req,res)=>{const d=readDB();d.transfers=d.transfers.filter(x=>x.id!==req.params.id);writeDB(d);res.json({ok:true})});

app.get("/api/public",(req,res)=>{const d=readDB();res.json({news:d.news,transfers:d.transfers})});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("Ahli News Admin running on "+PORT));
