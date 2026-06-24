"use strict";

/* =========================================================
   DATA MODEL
   ========================================================= */
const defaultSchemas = () => ([
  { nama:"users", kolom:[
    {nama:"id",tipe:"BIGINT",isPK:true,isNotNull:true,refTable:"",refCol:""},
    {nama:"username",tipe:"VARCHAR(50)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"email",tipe:"VARCHAR(100)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"password",tipe:"VARCHAR(255)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"role",tipe:"VARCHAR(20)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"created_at",tipe:"TIMESTAMP",isPK:false,isNotNull:false,refTable:"",refCol:""}]},
  { nama:"templates", kolom:[
    {nama:"id",tipe:"BIGINT",isPK:true,isNotNull:true,refTable:"",refCol:""},
    {nama:"name",tipe:"VARCHAR(100)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"description",tipe:"TEXT",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"file_path",tipe:"VARCHAR(255)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"config",tipe:"JSONB",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"frame_count",tipe:"INT",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"created_at",tipe:"TIMESTAMP",isPK:false,isNotNull:false,refTable:"",refCol:""}]},
  { nama:"filters", kolom:[
    {nama:"id",tipe:"BIGINT",isPK:true,isNotNull:true,refTable:"",refCol:""},
    {nama:"name",tipe:"VARCHAR(50)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"css_class",tipe:"VARCHAR(50)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"description",tipe:"TEXT",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"created_at",tipe:"TIMESTAMP",isPK:false,isNotNull:false,refTable:"",refCol:""}]},
  { nama:"photobooth_sessions", kolom:[
    {nama:"id",tipe:"BIGINT",isPK:true,isNotNull:true,refTable:"",refCol:""},
    {nama:"user_id",tipe:"BIGINT",isPK:false,isNotNull:true,refTable:"users",refCol:"id"},
    {nama:"template_id",tipe:"BIGINT",isPK:false,isNotNull:true,refTable:"templates",refCol:"id"},
    {nama:"status",tipe:"VARCHAR(20)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"started_at",tipe:"TIMESTAMP",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"completed_at",tipe:"TIMESTAMP",isPK:false,isNotNull:false,refTable:"",refCol:""}]},
  { nama:"photobooth_results", kolom:[
    {nama:"id",tipe:"BIGINT",isPK:true,isNotNull:true,refTable:"",refCol:""},
    {nama:"session_id",tipe:"BIGINT",isPK:false,isNotNull:true,refTable:"photobooth_sessions",refCol:"id"},
    {nama:"final_image_path",tipe:"VARCHAR(255)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"created_at",tipe:"TIMESTAMP",isPK:false,isNotNull:false,refTable:"",refCol:""}]}
]);
const defaultTestCases = () => ([
  {id:1,skenario:"Registrasi Akun Baru",hasilDiharapkan:"Data pengguna berhasil tersimpan di database dengan password terenkripsi",status:"Berhasil",buktiGambar:[]},
  {id:2,skenario:"Login Pengguna / Admin",hasilDiharapkan:"Sistem memverifikasi password dan mengembalikan JWT Token untuk akses halaman privat",status:"Berhasil",buktiGambar:[]},
  {id:3,skenario:"Membuat Sesi Foto Baru",hasilDiharapkan:"Sesi foto tersimpan di database dengan status 'active' dan template yang dipilih",status:"Berhasil",buktiGambar:[]},
  {id:4,skenario:"Menyimpan Hasil Foto Final",hasilDiharapkan:"Foto final terupload ke Supabase Storage dan link tersimpan di database",status:"Berhasil",buktiGambar:[]}
]);

let schemas = defaultSchemas();
let mockupImages = [];
let screenshotImages = [];
let testCases = defaultTestCases();
let nextTestCaseId = 5;

const STORE_KEY = "rndSQL2_final_v2";

/* =========================================================
   UTIL
   ========================================================= */
function escapeHtml(s){
  if(s===undefined||s===null) return '';
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
const $ = id => document.getElementById(id);

/* =========================================================
   PENYIMPANAN — IndexedDB (kuota besar) + kompres gambar
   Antisipasi "memory full": gambar dikompres, data utama di
   IndexedDB (bukan localStorage 5MB), localStorage hanya
   cadangan teks ringan.
   ========================================================= */
const IDB_NAME = "rndSQL2DB";
const IDB_STORE = "doc";
const IMG_MAX_SIZE = 1200;   // px sisi terpanjang
const IMG_QUALITY = 0.72;    // kualitas JPEG

function idbOpen(){
  return new Promise((res,rej)=>{
    if(!window.indexedDB){ rej(new Error("IndexedDB tidak tersedia")); return; }
    const req = indexedDB.open(IDB_NAME,1);
    req.onupgradeneeded = ()=>{ req.result.createObjectStore(IDB_STORE); };
    req.onsuccess = ()=>res(req.result);
    req.onerror = ()=>rej(req.error);
  });
}
function idbSet(key,val){
  return idbOpen().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(IDB_STORE,"readwrite");
    tx.objectStore(IDB_STORE).put(val,key);
    tx.oncomplete=()=>res(true);
    tx.onerror=()=>rej(tx.error);
  }));
}
function idbGet(key){
  return idbOpen().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(IDB_STORE,"readonly");
    const r=tx.objectStore(IDB_STORE).get(key);
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);
  }));
}

/* Kompres + resize gambar sebelum disimpan (mengembalikan dataURL JPEG) */
function compressImage(file){
  return new Promise((resolve)=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        let {width:w,height:h}=img;
        if(w>h && w>IMG_MAX_SIZE){ h=Math.round(h*IMG_MAX_SIZE/w); w=IMG_MAX_SIZE; }
        else if(h>=w && h>IMG_MAX_SIZE){ w=Math.round(w*IMG_MAX_SIZE/h); h=IMG_MAX_SIZE; }
        const cv=document.createElement("canvas");
        cv.width=w; cv.height=h;
        cv.getContext("2d").drawImage(img,0,0,w,h);
        try{ resolve(cv.toDataURL("image/jpeg",IMG_QUALITY)); }
        catch(e){ resolve(ev.target.result); } // fallback bila gambar CORS/SVG
      };
      img.onerror=()=>resolve(ev.target.result);
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Tampilkan pemakaian penyimpanan di bar atas */
function updateStorageMeter(){
  const el=$("storageMeter"); if(!el) return;
  if(navigator.storage && navigator.storage.estimate){
    navigator.storage.estimate().then(est=>{
      const usedMB=(est.usage||0)/1048576;
      const quotaMB=(est.quota||0)/1048576;
      el.textContent=`DB: ${usedMB.toFixed(1)} MB`;
      el.classList.remove("warn","full");
      if(quotaMB>0){
        const ratio=usedMB/quotaMB;
        if(ratio>0.9) el.classList.add("full");
        else if(ratio>0.7) el.classList.add("warn");
      }
    }).catch(()=>{ el.textContent="DB: ok"; });
  } else { el.textContent="DB: ok"; }
}

/* =========================================================
   DAFTAR ISI (auto)  — pakai angka romawi
   ========================================================= */
const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
function buildTOC(){
  const list = $("tocList");
  const secs = document.querySelectorAll(".section[data-toc]");
  let html = "";
  secs.forEach((s,i)=>{
    const label = s.getAttribute("data-toc");
    html += `<li><a href="#${s.id}"><span class="roman">${ROMAN[i]||(i+1)}.</span> <span>${label}</span><span class="leader"></span></a></li>`;
  });
  list.innerHTML = html;
}

/* =========================================================
   SCHEMA BUILDER
   ========================================================= */
function renderDynamicTables(){
  const container = $("daftarTabelDinamis");
  if(!container) return;
  let html = "";
  schemas.forEach((tbl,idxT)=>{
    html += `<div class="schema-row">
      <div class="row-top">
        <input type="text" class="input" style="max-width:260px;font-weight:700;" value="${escapeHtml(tbl.nama)}" onchange="updateNamaTabel(${idxT},this.value)">
        <button class="btn btn-sm btn-danger no-print" onclick="hapusTabelFunc(${idxT})">Hapus Tabel</button>
      </div>
      <div class="table-scroll"><table class="tbl"><thead><tr>
        <th>Kolom</th><th>Tipe Data</th><th class="ck">PK</th><th class="ck">Not Null</th><th>Foreign Key</th><th class="ck no-print">Aksi</th>
      </tr></thead><tbody>`;
    tbl.kolom.forEach((kol,idxK)=>{
      html += `<tr>
        <td><input class="input" value="${escapeHtml(kol.nama)}" onchange="updateKolomFunc(${idxT},${idxK},'nama',this.value)"></td>
        <td><input class="input" value="${escapeHtml(kol.tipe)}" onchange="updateKolomFunc(${idxT},${idxK},'tipe',this.value)"></td>
        <td class="ck"><input type="checkbox" ${kol.isPK?"checked":""} onchange="updateKolomFunc(${idxT},${idxK},'isPK',this.checked)"></td>
        <td class="ck"><input type="checkbox" ${kol.isNotNull?"checked":""} onchange="updateKolomFunc(${idxT},${idxK},'isNotNull',this.checked)"></td>
        <td><select class="input" onchange="updateFKFunc(${idxT},${idxK},this.value)">${generateFkOptions(tbl.nama,kol.refTable,kol.refCol)}</select></td>
        <td class="ck no-print"><button class="btn btn-sm btn-danger" onclick="hapusKolomFunc(${idxT},${idxK})">X</button></td>
      </tr>`;
    });
    html += `</tbody></table></div>
      <button class="btn btn-sm btn-light no-print" style="margin-top:10px;" onclick="tambahKolomFunc(${idxT})">+ Tambah Kolom</button>
    </div>`;
  });
  container.innerHTML = html;
  generateSQLAndPreview();
  renderDataDictionary();
}

function generateFkOptions(currentTable,curRefTable,curRefCol){
  let opts = `<option value="">— Tanpa FK —</option>`;
  schemas.forEach(t=>{
    if(t.nama===currentTable) return;
    t.kolom.forEach(k=>{
      if(k.isPK){
        const val = `${t.nama}.${k.nama}`;
        const sel = (curRefTable===t.nama&&curRefCol===k.nama)?"selected":"";
        opts += `<option value="${escapeHtml(val)}" ${sel}>${escapeHtml(val)}</option>`;
      }
    });
  });
  return opts;
}

window.updateNamaTabel=(i,v)=>{if(schemas[i])schemas[i].nama=v;renderDynamicTables();};
window.hapusTabelFunc=(i)=>{schemas.splice(i,1);renderDynamicTables();};
window.tambahKolomFunc=(i)=>{schemas[i].kolom.push({nama:"kolom_baru",tipe:"VARCHAR(100)",isPK:false,isNotNull:false,refTable:"",refCol:""});renderDynamicTables();};
window.hapusKolomFunc=(t,k)=>{schemas[t].kolom.splice(k,1);renderDynamicTables();};
window.updateKolomFunc=(t,k,f,v)=>{schemas[t].kolom[k][f]=v;renderDynamicTables();};
window.updateFKFunc=(t,k,v)=>{
  if(!v){schemas[t].kolom[k].refTable="";schemas[t].kolom[k].refCol="";}
  else{const[rt,rc]=v.split('.');schemas[t].kolom[k].refTable=rt;schemas[t].kolom[k].refCol=rc;}
  renderDynamicTables();
};

function generateSQLAndPreview(){
  let ddl="",rel="";
  schemas.forEach(t=>{
    ddl += `CREATE TABLE ${t.nama} (\n`;
    const cols=[];
    t.kolom.forEach(k=>{
      let line=`  ${k.nama} ${k.tipe}`;
      if(k.isNotNull) line+=" NOT NULL";
      if(k.isPK) line+=" PRIMARY KEY";
      cols.push(line);
    });
    t.kolom.forEach(k=>{
      if(k.refTable&&k.refCol){
        cols.push(`  FOREIGN KEY (${k.nama}) REFERENCES ${k.refTable}(${k.refCol})`);
        rel += `- ${t.nama}.${k.nama} -> ${k.refTable}.${k.refCol}\n`;
      }
    });
    ddl += cols.join(",\n")+"\n);\n\n";
  });
  $("previewDDL").textContent = ddl || "-- belum ada tabel";
  $("previewRelasi").textContent = rel || "-- tidak ada foreign key";
  $("lampiranSQL").value = `-- DDL\n${ddl}-- DML (isi data contoh di sini)\n`;
}

function renderDataDictionary(){
  const body = $("dataDictionary").querySelector("tbody");
  let html = `<tr><th>Tabel</th><th>Kolom</th><th>Tipe</th><th>Keterangan</th></tr>`;
  schemas.forEach(t=>{
    t.kolom.forEach(k=>{
      const ket=[];
      if(k.isPK) ket.push("Primary Key");
      if(k.isNotNull) ket.push("Wajib diisi");
      if(k.refTable) ket.push(`FK -> ${k.refTable}.${k.refCol}`);
      html += `<tr><td>${escapeHtml(t.nama)}</td><td>${escapeHtml(k.nama)}</td><td>${escapeHtml(k.tipe)}</td><td>${ket.join(", ")||"-"}</td></tr>`;
    });
  });
  body.innerHTML = html;
}

/* =========================================================
   TEST CASES
   ========================================================= */
function badgeFor(status){
  if(status==="Gagal") return '<span class="badge badge-fail">Gagal</span>';
  if(status==="Perbaikan") return '<span class="badge badge-fix">Perbaikan</span>';
  return '<span class="badge badge-ok">Berhasil</span>';
}
function renderTestCases(){
  const container=$("testCasesContainer");
  if(!container)return;
  let html="";
  testCases.forEach((tc,idx)=>{
    html += `<div class="tc-item">
      <div class="tc-grid">
        <div><label class="fld">Skenario Uji</label><input class="input" value="${escapeHtml(tc.skenario)}" onchange="updateTestCase(${idx},'skenario',this.value)"></div>
        <div><label class="fld">Hasil Diharapkan</label><input class="input" value="${escapeHtml(tc.hasilDiharapkan)}" onchange="updateTestCase(${idx},'hasilDiharapkan',this.value)"></div>
        <div><label class="fld">Status</label>
          <select class="input" onchange="updateTestCase(${idx},'status',this.value)">
            <option ${tc.status==='Berhasil'?'selected':''}>Berhasil</option>
            <option ${tc.status==='Gagal'?'selected':''}>Gagal</option>
            <option ${tc.status==='Perbaikan'?'selected':''}>Perbaikan</option>
          </select>
        </div>
        <div class="no-print"><button class="btn btn-sm btn-danger" onclick="hapusTestCase(${idx})">Hapus</button></div>
      </div>
      <div class="tc-bukti">
        <label class="fld">Bukti Screenshot ${badgeFor(tc.status)}</label>
        <div class="tc-thumbs" id="buktiGallery_${tc.id}"></div>
        <button type="button" class="btn btn-sm btn-light no-print" style="margin-top:8px;" onclick="tambahBuktiUji(${tc.id})">Upload Bukti</button>
      </div>
    </div>`;
  });
  container.innerHTML=html;
  testCases.forEach(tc=>{
    const g=$(`buktiGallery_${tc.id}`);
    if(!g)return;
    let h="";
    tc.buktiGambar.forEach((img,i)=>{
      h += `<div class="tc-thumb">
        <img src="${escapeHtml(img.src)}" alt="bukti">
        <input class="input" style="margin-top:6px;font-size:12px;" placeholder="Keterangan" value="${escapeHtml(img.caption)}" onchange="updateBuktiKeterangan(${tc.id},${i},this.value)">
        <button class="btn btn-sm btn-danger no-print" style="margin-top:6px;width:100%;" onclick="hapusBuktiUji(${tc.id},${i})">Hapus</button>
      </div>`;
    });
    g.innerHTML = h || '<span class="gallery-empty">Belum ada bukti. Klik "Upload Bukti".</span>';
  });
  updateProgress();
}
window.updateTestCase=(i,f,v)=>{if(testCases[i])testCases[i][f]=v;renderTestCases();};
window.hapusTestCase=(i)=>{testCases.splice(i,1);renderTestCases();};
window.tambahBuktiUji=(id)=>{
  const fi=document.createElement('input');fi.type='file';fi.accept='image/*';
  fi.onchange=e=>{const f=e.target.files[0];if(!f)return;
    compressImage(f).then(src=>{const tc=testCases.find(t=>t.id===id);if(tc){tc.buktiGambar.push({src,caption:'Bukti: '+tc.skenario});renderTestCases();}});};
  fi.click();
};
window.hapusBuktiUji=(id,i)=>{const tc=testCases.find(t=>t.id===id);if(tc){tc.buktiGambar.splice(i,1);renderTestCases();}};
window.updateBuktiKeterangan=(id,i,v)=>{const tc=testCases.find(t=>t.id===id);if(tc&&tc.buktiGambar[i]){tc.buktiGambar[i].caption=v;}};

/* =========================================================
   GALLERIES (mockup & screenshot)
   ========================================================= */
function renderGallery(containerId,arr){
  const c=$(containerId);if(!c)return;
  let h="";
  arr.forEach((item,idx)=>{
    h += `<div class="gallery-item">
      <img src="${escapeHtml(item.src)}" alt="gambar">
      <input class="input" style="margin-top:8px;font-size:13px;" placeholder="Keterangan gambar..." value="${escapeHtml(item.caption)}" onchange="updateGalleryCaption('${containerId}',${idx},this.value)">
      <button class="btn btn-sm btn-danger no-print" style="margin-top:8px;width:100%;" onclick="removeGalleryImage('${containerId}',${idx})">Hapus</button>
    </div>`;
  });
  c.innerHTML = h || '<span class="gallery-empty">Belum ada gambar.</span>';
}
function arrFor(containerId){return containerId==='mockupGalleryContainer'?mockupImages:screenshotImages;}
window.updateGalleryCaption=(cid,idx,v)=>{const a=arrFor(cid);if(a[idx])a[idx].caption=v;};
window.removeGalleryImage=(cid,idx)=>{const a=arrFor(cid);a.splice(idx,1);renderGallery(cid,a);};
function addImageToGallery(type){
  const cid = type==='mockup'?'mockupGalleryContainer':'screenshotGalleryContainer';
  const arr = arrFor(cid);
  const fi=document.createElement('input');fi.type='file';fi.accept='image/*';
  fi.onchange=e=>{const f=e.target.files[0];if(!f)return;
    compressImage(f).then(src=>{arr.push({src,caption:type==='mockup'?'Desain antarmuka':'Tampilan aplikasi'});renderGallery(cid,arr);});};
  fi.click();
}

/* =========================================================
   PRINT MIRROR — ubah input jadi teks dokumen formal
   ========================================================= */
function syncPrintMirrors(){
  document.querySelectorAll("#rndDocument input[id], #rndDocument textarea[id], #rndDocument select[id]").forEach(el=>{
    if(el.type==="checkbox"||el.type==="file") return;
    let m = el.nextElementSibling;
    if(!m || !m.classList || !m.classList.contains("print-mirror")){
      m = document.createElement("div");
      m.className="print-mirror";
      el.parentNode.insertBefore(m, el.nextSibling);
    }
    const val = (el.value||"").trim();
    m.textContent = val || "—";
  });
}

/* =========================================================
   PERSISTENCE
   ========================================================= */
function collectFormData(){
  const data={};
  document.querySelectorAll("#rndDocument input, #rndDocument textarea, #rndDocument select").forEach(el=>{
    if(el.id) data[el.id]=el.value;
  });
  data.__schemas=schemas;
  data.__mockup=mockupImages;
  data.__screenshot=screenshotImages;
  data.__testCases=testCases;
  data.__nextTestCaseId=nextTestCaseId;
  return data;
}
/* Cadangan teks-saja (tanpa gambar) ke localStorage — selalu kecil & aman */
function saveTextFallback(data){
  try{
    const lite={...data};
    lite.__mockup=[]; lite.__screenshot=[];
    lite.__testCases=(data.__testCases||[]).map(tc=>({...tc,buktiGambar:[]}));
    localStorage.setItem(STORE_KEY, JSON.stringify(lite));
  }catch(e){ /* abaikan, IDB yang utama */ }
}

function applyData(d){
  if(Array.isArray(d.__schemas)) schemas=d.__schemas;
  if(Array.isArray(d.__mockup)) mockupImages=d.__mockup;
  if(Array.isArray(d.__screenshot)) screenshotImages=d.__screenshot;
  if(Array.isArray(d.__testCases)) testCases=d.__testCases;
  if(d.__nextTestCaseId) nextTestCaseId=d.__nextTestCaseId;
  for(const k in d){
    if(k.startsWith("__")) continue;
    const el=$(k); if(el) el.value=d[k];
  }
}
function renderAll(){
  renderDynamicTables();
  renderGallery('mockupGalleryContainer',mockupImages);
  renderGallery('screenshotGalleryContainer',screenshotImages);
  renderTestCases();
  updateProgress();
}

function saveAllFormData(silent){
  const data=collectFormData();
  saveTextFallback(data); // teks selalu aman walau gambar gagal
  idbSet("main",data).then(()=>{
    updateStorageMeter();
    if(!silent) alert("Tersimpan. Semua data (termasuk gambar) tercatat di browser ini.");
  }).catch(err=>{
    console.warn("IDB simpan gagal:",err);
    updateStorageMeter();
    if(!silent) alert("Teks tersimpan, tetapi GAMBAR gagal disimpan (penyimpanan penuh).\n\nSaran: gunakan tombol Export untuk backup .json, atau kurangi/hapus gambar besar.");
  });
}

function loadAllFormData(){
  idbGet("main").then(d=>{
    if(d){ applyData(d); renderAll(); updateStorageMeter(); return; }
    // migrasi dari localStorage lama bila ada
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){ try{ applyData(JSON.parse(raw)); }catch(e){ console.warn(e); } }
    renderAll(); updateStorageMeter();
  }).catch(()=>{
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){ try{ applyData(JSON.parse(raw)); }catch(e){ console.warn(e); } }
    renderAll(); updateStorageMeter();
  });
}

/* ---------- EXPORT / IMPORT .json (backup portabel) ---------- */
function exportJSON(){
  const data=collectFormData();
  const nim=(data.nim||"mahasiswa").replace(/[^\w.-]/g,"_");
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`RND_SQL2_${nim}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function importJSON(file){
  const r=new FileReader();
  r.onload=ev=>{
    try{
      const d=JSON.parse(ev.target.result);
      if(!confirm("Muat data dari file ini? Data saat ini akan tertimpa."))return;
      applyData(d); renderAll();
      saveAllFormData(true);
      alert("Data berhasil dimuat dari file .json.");
    }catch(e){ alert("File tidak valid / bukan backup RND yang benar."); }
  };
  r.readAsText(file);
}
function resetDefault(){
  if(!confirm("Yakin reset semua data ke kondisi kosong/default? Tindakan ini tidak bisa dibatalkan."))return;
  localStorage.removeItem(STORE_KEY);
  idbSet("main",null).catch(()=>{});
  schemas=defaultSchemas();mockupImages=[];screenshotImages=[];
  testCases=defaultTestCases();nextTestCaseId=5;
  document.querySelectorAll("#rndDocument input, #rndDocument textarea").forEach(el=>{
    if(el.type==='checkbox'||el.type==='file') return;
    el.value='';
  });
  $("institusi").value="Politeknik Negeri Lampung";
  renderDynamicTables();
  renderGallery('mockupGalleryContainer',mockupImages);
  renderGallery('screenshotGalleryContainer',screenshotImages);
  renderTestCases();
  updateProgress();
  updateStorageMeter();
  alert("Dokumen telah direset.");
}

/* =========================================================
   CONTOH (sample fill)
   ========================================================= */
function isiContoh(){
  if(!confirm("Isi field dengan data contoh proyek Photobooth?"))return;
  const v={
    judulProyek: "Aplikasi Web Photobooth Mandiri berbasis Supabase",
    namaMahasiswa: "Nabil Armdhani",
    nim: "2300000",
    kelasSemester: "Manajemen Informatika",
    dosenPengampu: "Dosen Pengampu Pemrograman SQL II",
    tglMulai: "2026-06-01",
    tglSelesai: "2026-06-24",
    latarBelakang: "Perkembangan teknologi kamera web dan media sosial mendorong popularitas photobooth sebagai sarana hiburan mandiri yang interaktif. Namun, sebagian besar aplikasi photobooth yang ada bersifat luring (offline) dan memerlukan perangkat keras khusus yang mahal. Untuk mengatasi kendala ini, dirancang sebuah aplikasi Photobooth Mandiri berbasis web. Proyek ini menggunakan arsitektur modern berbasis React di frontend dan Express.js di backend, dengan integrasi cloud database Supabase untuk pengelolaan data real-time, autentikasi aman, serta penyimpanan aset foto digital secara terpusat.",
    rumusanMasalah: "1. Bagaimana merancang basis data relasional di Supabase untuk mengelola data user, template frame, sesi photobooth, dan hasil foto?\n2. Bagaimana mengimplementasikan operasi CRUD untuk mendukung pembuatan sesi foto, penggunaan filter, dan penyimpanan hasil akhir foto?\n3. Bagaimana mengintegrasikan Supabase Storage untuk penyimpanan foto final secara online dan efisien?",
    tujuanProyek: "1. Membangun aplikasi web Photobooth Mandiri interaktif dengan fitur capture kamera langsung, pemilihan template frame, dan filter gambar.\n2. Merancang dan mengimplementasikan database relasional di Supabase dengan minimal 5 tabel terelasi menggunakan Foreign Key.\n3. Menyediakan sistem autentikasi pengguna dengan pembagian peran (Role) antara Admin dan User biasa.",
    lingkupDikerjakan: "- Antarmuka frontend menggunakan React, Tailwind CSS, dan Framer Motion.\n- Sistem autentikasi login/register berbasis JWT.\n- Integrasi kamera web (React Webcam) dengan countdown dan capture otomatis.\n- Fitur canvas merging untuk menyatukan frame template dengan foto tangkapan kamera.\n- Manajemen template frame foto oleh Admin (Upload, Edit, Delete).\n- Halaman galeri riwayat foto untuk setiap user.",
    lingkupTidak: "- Sistem pembayaran untuk pencetakan foto fisik.\n- Integrasi dengan printer thermal secara langsung dari browser.\n- Fitur share langsung ke media sosial seperti Instagram API (hanya download lokal).",
    targetUser: "Pengguna umum (user) yang ingin berfoto menggunakan webcam, dan Administrator (admin) yang mengelola template bingkai foto.",
    manfaat: "Memberikan kemudahan bagi pengguna untuk mengabadikan momen secara mandiri secara digital tanpa antrean fisik, serta memudahkan admin mengelola aset bingkai foto secara terpusat dan efisien.",
    techStackDetail: "Arsitektur: Client-Server berbasis REST API dengan Database Terpusat.\n- Frontend: React.js, Vite, Tailwind CSS, Framer Motion (Hosting: Netlify)\n- Backend: Node.js, Express.js (Hosting: Vercel)\n- Database: PostgreSQL (Managed by Supabase)\n- Storage: Supabase Storage (Buckets: overlays, results)\n- Keamanan: JSON Web Token (JWT) untuk Autentikasi, enkripsi password menggunakan bcryptjs",
    folderStructureDetail: "photobooth/\n|-- api/\n|   `-- index.js\n|-- backend/\n|   |-- config/ (db.js)\n|   |-- controllers/ (authController.js, photoboothController.js)\n|   |-- middlewares/ (verifyToken.js)\n|   |-- models/ (userModel.js, templateModel.js, sessionModel.js, resultModel.js, filterModel.js)\n|   |-- routes/ (authRoutes.js, photoboothRoutes.js)\n|   `-- server.js\n|-- frontend/\n|   |-- src/ (components, context, pages, services)\n|   `-- package.json\n|-- netlify.toml\n`-- vercel.json",
    userFlow: "1. Pengguna membuka Landing Page -> Melakukan Registrasi / Login.\n2. Pengguna masuk ke Dashboard -> Memilih Template Frame di Gallery.\n3. Sistem mengarahkan ke halaman Kamera -> Mengambil foto secara berurutan sesuai frame.\n4. Pengguna memilih Filter Gambar -> Sistem memproses penggabungan foto (merging).\n5. Pengguna melihat preview hasil akhir -> Mengunduh foto atau melihat di halaman History.\n6. Admin: Login -> Mengakses halaman /admin/templates -> Menambah/menghapus template frame.",
    routingTable: "Endpoint API Backend:\n- POST /api/auth/register : Registrasi akun baru\n- POST /api/auth/login : Autentikasi login user/admin\n- GET /api/auth/profile : Mengambil profil user aktif\n- GET /api/photobooth/templates : Mengambil semua template frame\n- POST /api/photobooth/templates : Menambah template baru (Admin Only)\n- GET /api/photobooth/filters : Mengambil semua filter gambar\n- POST /api/photobooth/sessions : Membuat sesi foto baru\n- POST /api/photobooth/save : Menyimpan hasil foto final",
    codeCreate: "// Contoh implementasi register user baru di authController.js:\nconst salt = await bcrypt.genSalt(10);\nconst hashedPassword = await bcrypt.hash(password, salt);\nconst userId = await User.create(username, email, hashedPassword);",
    codeRead: "// Mengambil riwayat hasil foto beserta info session dan template name:\nconst { data, error } = await supabase\n    .from('photobooth_results')\n    .select('id, final_image_path, created_at, session_id, photobooth_sessions!inner(user_id, templates(name))')\n    .eq('photobooth_sessions.user_id', userId);",
    codeUpdate: "// Memperbarui status sesi photobooth setelah selesai:\nconst { error } = await supabase\n    .from('photobooth_sessions')\n    .update({ status: 'completed', completed_at: new Date().toISOString() })\n    .eq('id', sessionId);",
    codeDelete: "// Menghapus hasil foto berdasarkan ID:\nconst { error } = await supabase\n    .from('photobooth_results')\n    .delete()\n    .eq('id', id);",
    metodeHosting: "VPS / Cloud",
    urlHosting: "https://tiny-kitten-7dcd14.netlify.app",
    langkahDeploy: "1. Inisialisasi Database Supabase: Menjalankan skrip DDL SQL di editor kueri Supabase untuk membuat tabel-tabel (users, templates, dll).\n2. Konfigurasi Bucket Storage: Membuat bucket 'overlays' dan 'results' di Supabase dengan akses public.\n3. Deploy Backend di Vercel: Menghubungkan repositori GitHub, mengonfigurasi variabel lingkungan (SUPABASE_URL, SUPABASE_KEY, JWT_SECRET), dan melakukan deploy.\n4. Deploy Frontend di Netlify: Mengunggah kode frontend, menambahkan file netlify.toml untuk base directory 'frontend' dan redirect rute, menambahkan VITE_API_URL sebagai variabel lingkungan yang mengarah ke backend Vercel, lalu melakukan build.",
    konfigChange: "Lokal:\n- Database: MySQL lokal (localhost) atau Supabase development keys.\n- API URL: http://localhost:5000/api\n\nHosting (Production):\n- Database: Cloud PostgreSQL Managed by Supabase.\n- API URL: https://projectmandiri-backend.vercel.app",
    ringkasanPengujian: "Pengujian fungsional dilakukan terhadap seluruh fitur utama meliputi: registrasi, login, pembuatan sesi foto, pengambilan gambar dari kamera web, penerapan filter, penggabungan canvas, dan penyimpanan ke storage online. Hasil pengujian menunjukkan seluruh skenario uji berhasil 100% tanpa adanya kendala fungsional kritis.",
    kendalaSolusiPengujian: "Kendala 1: Error 404 Page Not Found saat me-refresh halaman web pada Netlify.\nSolusi: Menambahkan file netlify.toml di root proyek yang berisi konfigurasi redirects dari '/*' ke '/index.html' dengan status 200.\n\nKendala 2: Proses upload foto final gagal karena batasan penyimpanan lokal.\nSolusi: Mengintegrasikan Supabase Storage dengan bucket berstatus publik ('results') untuk menampung berkas foto final secara langsung.",
    kesimpulanPengujian: "Sistem dinyatakan layak digunakan untuk production (Fully Functional).",
    kesimpulan: "1. Aplikasi web Photobooth Mandiri berhasil dikembangkan menggunakan tech stack React, Express.js, dan Supabase.\n2. Desain database relasional yang mencakup 5 tabel (users, templates, filters, photobooth_sessions, photobooth_results) telah diimplementasikan dengan integritas referensial (Foreign Key) yang bekerja dengan baik.\n3. Integrasi cloud storage Supabase berhasil mengatasi kebutuhan penyimpanan dinamis untuk template bingkai dan file hasil jepretan foto.\n4. Deployment terpisah antara frontend (Netlify) dan backend (Vercel) terbukti efektif dan responsif.",
    saran: "1. Menambahkan fitur pilihan kolase foto yang lebih bervariasi serta opsi penambahan stiker dekoratif secara real-time.\n2. Mengimplementasikan sistem kupon/pembayaran digital (seperti Midtrans) bagi pengguna sebelum melakukan pencetakan foto.\n3. Menambahkan fitur pengiriman hasil foto langsung ke email pengguna menggunakan layanan mailing service.",
    githubRepo: "https://github.com/nbillarmdhani-png/projectmandiri",
    videoLink: "https://youtu.be/dummy-video-link-sql2",
    referensi: "1. Supabase Documentation: Database & Storage Guides (https://supabase.com/docs)\n2. Express.js API Reference Guide (https://expressjs.com)\n3. React Router v7 Documentation (https://reactrouter.com)",
    pernyataanAI: "Saya menyatakan dokumen ini adalah hasil karya sendiri dan dibuat untuk keperluan tugas akademik Pemrograman SQL II. Penggunaan bantuan AI (Antigravity AI) digunakan untuk membantu penataan dokumen, perancangan DDL, dan penulisan skrip konfigurasi deploy secara transparan dan jujur."
  };
  for(const k in v){const el=$(k);if(el)el.value=v[k];}
  updateProgress();
  alert("Data contoh Photobooth berhasil dimasukkan ke seluruh form.");
}

/* =========================================================
   PROGRESS
   ========================================================= */
function updateProgress(){
  const req=document.querySelectorAll("[data-required]");
  let filled=0;
  req.forEach(el=>{ if(el.value && el.value.trim()!=='') filled++; });
  const total=req.length||1;
  const pct=Math.round(filled/total*100);
  $("progressFill").style.width=pct+"%";
  $("progressPct").textContent=pct+"%";
}

/* =========================================================
   VALIDATE & PRINT
   ========================================================= */
function validateAndPrint(){
  const missing=[];
  document.querySelectorAll("[data-required]").forEach(el=>{
    if(!el.value || el.value.trim()===''){
      const lbl = el.getAttribute("data-label") || el.placeholder || el.id;
      missing.push(lbl);
    }
  });
  if(missing.length){
    const proceed=confirm("Ada "+missing.length+" bagian wajib yang belum diisi:\n\n- "+
      missing.slice(0,10).join("\n- ")+(missing.length>10?"\n- ...":"")+
      "\n\nTetap lanjut mencetak?");
    if(!proceed) return;
  }
  syncPrintMirrors();
  saveAllFormData(true);
  window.print();
}

/* =========================================================
   INIT
   ========================================================= */
window.addEventListener("DOMContentLoaded",()=>{
  buildTOC();
  const yr=$("copyYear"); if(yr) yr.textContent=new Date().getFullYear();
  loadAllFormData();

  $("btnTambahTabel").addEventListener("click",()=>{
    schemas.push({nama:`tabel_${schemas.length+1}`,kolom:[{nama:"id",tipe:"INT",isPK:true,isNotNull:true,refTable:"",refCol:""}]});
    renderDynamicTables();
  });
  $("btnTambahTestCase").addEventListener("click",()=>{
    testCases.push({id:nextTestCaseId++,skenario:"Skenario uji baru",hasilDiharapkan:"Deskripsikan hasil yang diharapkan",status:"Berhasil",buktiGambar:[]});
    renderTestCases();
  });
  $("simpanDataBtn").addEventListener("click",()=>saveAllFormData(false));
  $("resetBtn").addEventListener("click",resetDefault);
  $("contohBtn").addEventListener("click",isiContoh);
  $("cetakPDFBtn").addEventListener("click",validateAndPrint);
  $("exportBtn").addEventListener("click",exportJSON);
  $("importBtn").addEventListener("click",()=>$("importFile").click());
  $("importFile").addEventListener("change",e=>{ if(e.target.files[0]) importJSON(e.target.files[0]); e.target.value=""; });

  document.querySelectorAll(".btn-tambah-gambar").forEach(btn=>{
    btn.addEventListener("click",()=>addImageToGallery(btn.getAttribute("data-gallery")));
  });

  // dukung Ctrl+P agar mirror tetap tersinkron
  window.addEventListener("beforeprint", syncPrintMirrors);

  // live progress + autosave (debounced)
  let t;
  document.addEventListener("input",()=>{
    updateProgress();
    clearTimeout(t); t=setTimeout(()=>saveAllFormData(true),1200);
  });
});
