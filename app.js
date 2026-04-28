/* ============================================================
   MTESS · Funcionarios & Salarios 2021-2024
   App SPA con datos embebidos (data.js)
   ============================================================ */

// ===== Helpers =====
const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));
const fmt = (n) => 'Gs. ' + (n||0).toLocaleString('es-PY');
const fmtShort = (n) => {
  if (!n) return 'Gs. 0';
  const abs = Math.abs(n);
  if (abs >= 1e9) return 'Gs. ' + (n/1e9).toFixed(2) + ' MM';
  if (abs >= 1e6) return 'Gs. ' + (n/1e6).toFixed(1) + ' M';
  if (abs >= 1e3) return 'Gs. ' + (n/1e3).toFixed(0) + ' k';
  return 'Gs. ' + n;
};
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTH_KEYS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const COLORS = ['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6','#3b82f6','#ec4899','#06b6d4','#84cc16','#f97316'];

const charts = {};  // referencias para destruir
function makeChart(canvasId, config){
  if (charts[canvasId]) charts[canvasId].destroy();
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  charts[canvasId] = new Chart(ctx, config);
  return charts[canvasId];
}

// ===== LOGIN =====
$('#login-form').addEventListener('submit', e => {
  e.preventDefault();
  const u = $('#login-user').value.trim();
  const p = $('#login-pass').value;
  if (u === 'user' && p === '123'){
    sessionStorage.setItem('mtess_auth','1');
    enterApp();
  } else {
    $('#login-error').classList.remove('d-none');
    setTimeout(()=>$('#login-error').classList.add('d-none'), 2500);
  }
});
$('#logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('mtess_auth');
  $('#app-screen').classList.add('d-none');
  $('#login-screen').classList.remove('d-none');
});
function enterApp(){
  $('#login-screen').classList.add('d-none');
  $('#app-screen').classList.remove('d-none');
  initApp();
}
if (sessionStorage.getItem('mtess_auth') === '1'){ enterApp(); }

// ===== NAV =====
$$('.nav-link').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    $$('.nav-link').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    const view = a.dataset.view;
    $$('.view').forEach(v => v.classList.remove('active'));
    $(`section[data-section="${view}"]`).classList.add('active');
    const titles = {
      overview:['Resumen general','Panorama global del gasto en remuneraciones'],
      ranking:['Ranking de funcionarios','Top mejor pagados con búsqueda y exportación'],
      search:['Buscar funcionario','Detalle individual con evolución mensual'],
      concepto:['Por concepto de gasto','Distribución del gasto por tipo (sueldo, bonificación, viático…)'],
      estado:['Por estado','Permanentes vs contratados vs comisionados'],
      evolucion:['Evolución temporal','Series mensuales y anuales del gasto'],
      datos:['Datos crudos','Tabla detallada por persona/concepto/mes'],
    };
    if (titles[view]){
      $('#view-title').textContent = titles[view][0];
      $('#view-subtitle').textContent = titles[view][1];
    }
    renderView(view);
  });
});

$('#year-filter').addEventListener('change', () => {
  const view = $('.nav-link.active').dataset.view;
  renderView(view);
});

// ===== STATE =====
function getYear(){
  const v = $('#year-filter').value;
  return v === 'all' ? null : parseInt(v);
}
function filterPagos(year){
  if (year === null) return PAGOS;
  return PAGOS.filter(r => r[0] === year);
}
function filterResumen(year){
  if (year === null) return RESUMEN;
  return RESUMEN.filter(r => r.anio === year);
}

// ===== VIEWS =====
function renderView(view){
  if (view === 'overview') renderOverview();
  else if (view === 'ranking') renderRanking();
  else if (view === 'search') renderSearch();
  else if (view === 'concepto') renderConcepto();
  else if (view === 'estado') renderEstado();
  else if (view === 'evolucion') renderEvolucion();
  else if (view === 'datos') renderDatos();
}

// --- Overview ---
function renderOverview(){
  const year = getYear();
  const res = filterResumen(year);

  // Stats
  $('#stat-personas').textContent = res.length.toLocaleString('es-PY');
  $('#stat-personas-foot').textContent = year ? `año ${year}` : 'todos los años';

  const total = res.reduce((a,b) => a+b.tot, 0);
  $('#stat-total').textContent = fmtShort(total);
  $('#stat-total-foot').textContent = year ? `año ${year}` : 'acumulado 4 años';

  const promMensual = res.length ? Math.round(total / res.length / 12) : 0;
  $('#stat-prom').textContent = fmtShort(promMensual);

  const top = [...res].sort((a,b) => b.tot - a.tot)[0];
  $('#stat-max').textContent = top ? fmtShort(top.tot) : '—';
  $('#stat-max-foot').textContent = top ? top.nombre.slice(0,32) + (top.nombre.length>32?'…':'') : '';

  // Chart: evolución anual
  const totales = META.anios.map(y => RESUMEN.filter(r=>r.anio===y).reduce((a,b)=>a+b.tot,0));
  makeChart('chart-evolucion-anual', {
    type:'bar',
    data:{
      labels:META.anios,
      datasets:[{
        label:'Gasto total',
        data:totales,
        backgroundColor:'rgba(79,70,229,.8)',
        borderRadius:8,
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>fmt(c.parsed.y)}}},
      scales:{y:{ticks:{callback:v=>fmtShort(v)}}}
    }
  });

  // Chart: distribución por estado
  const estadoCnt = {P:0, C:0, X:0};
  filterPagos(year).forEach(r => {
    if (estadoCnt.hasOwnProperty(r[3])) estadoCnt[r[3]]++;
  });
  // contar personas únicas por estado mejor
  const personasPorEstado = {P:new Set(), C:new Set(), X:new Set()};
  filterPagos(year).forEach(r => {
    if (personasPorEstado[r[3]]) personasPorEstado[r[3]].add(r[2]);
  });
  makeChart('chart-estado', {
    type:'doughnut',
    data:{
      labels:['Permanente','Contratado','Comisionado'],
      datasets:[{
        data:[personasPorEstado.P.size, personasPorEstado.C.size, personasPorEstado.X.size],
        backgroundColor:['#10b981','#f59e0b','#8b5cf6'],
        borderWidth:0,
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'bottom'}}
    }
  });

  // Chart: top 10
  const top10 = [...res].sort((a,b)=>b.tot-a.tot).slice(0,10);
  makeChart('chart-top10', {
    type:'bar',
    data:{
      labels:top10.map(r => r.nombre.length>24 ? r.nombre.slice(0,22)+'…' : r.nombre),
      datasets:[{
        label:'Total anual',
        data:top10.map(r => r.tot),
        backgroundColor:'rgba(16,185,129,.8)',
        borderRadius:6,
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>fmt(c.parsed.x)}}},
      scales:{x:{ticks:{callback:v=>fmtShort(v)}}}
    }
  });

  // Chart: gasto por concepto
  const conceptoSum = {};
  filterPagos(year).forEach(r => {
    const c = r[4];
    if (!c) return;
    conceptoSum[c] = (conceptoSum[c]||0) + r[6];
  });
  const sorted = Object.entries(conceptoSum).sort((a,b)=>b[1]-a[1]).slice(0,8);
  makeChart('chart-conceptos', {
    type:'bar',
    data:{
      labels:sorted.map(([c]) => `${c} - ${(CONCEPTOS[c]||'').slice(0,25)}`),
      datasets:[{
        label:'Total',
        data:sorted.map(([_,v]) => v),
        backgroundColor:COLORS.slice(0,sorted.length),
        borderRadius:6,
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>fmt(c.parsed.x)}}},
      scales:{x:{ticks:{callback:v=>fmtShort(v)}}}
    }
  });
}

// --- Ranking ---
let rankingPage = 1;
const RANKING_PAGE_SIZE = 25;
function renderRanking(){
  const year = getYear();
  const res = year ? filterResumen(year) : aggregateAcrossYears();
  const search = ($('#ranking-search').value || '').toLowerCase().trim();
  const filtered = search
    ? res.filter(r => r.nombre.toLowerCase().includes(search) || String(r.cedula).includes(search))
    : res;
  const sorted = [...filtered].sort((a,b)=>b.tot-a.tot);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / RANKING_PAGE_SIZE));
  if (rankingPage > totalPages) rankingPage = 1;
  const start = (rankingPage-1) * RANKING_PAGE_SIZE;
  const page = sorted.slice(start, start + RANKING_PAGE_SIZE);

  const tbody = $('#ranking-table tbody');
  tbody.innerHTML = page.map((r,i) => `
    <tr data-cedula="${r.cedula}" data-anio="${r.anio || ''}">
      <td>${start+i+1}</td>
      <td><code>${r.cedula}</code></td>
      <td>${r.nombre}${!year ? ' <small class="text-muted">'+(r.anios||'')+'</small>' : ''}</td>
      <td class="text-end num">${fmtShort(r.ene)}</td>
      <td class="text-end num">${fmtShort(r.dic)}</td>
      <td class="text-end num">${fmtShort(r.agu)}</td>
      <td class="text-end num"><strong>${fmtShort(r.tot)}</strong></td>
      <td><i class="bi bi-eye"></i></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => showDetail(tr.dataset.cedula, tr.dataset.anio ? parseInt(tr.dataset.anio) : null));
  });

  $('#ranking-info').textContent = `Mostrando ${start+1}-${Math.min(start+RANKING_PAGE_SIZE, total)} de ${total.toLocaleString('es-PY')}`;
  renderPagination('ranking-pagination', rankingPage, totalPages, p => { rankingPage = p; renderRanking(); });
}
$('#ranking-search').addEventListener('input', () => { rankingPage = 1; renderRanking(); });
$('#ranking-export').addEventListener('click', exportRankingCSV);

function aggregateAcrossYears(){
  // sumar todos los años por cédula
  const map = {};
  RESUMEN.forEach(r => {
    if (!map[r.cedula]) map[r.cedula] = {
      cedula:r.cedula, nombre:r.nombre,
      ene:0,feb:0,mar:0,abr:0,may:0,jun:0,jul:0,ago:0,sep:0,oct:0,nov:0,dic:0,
      agu:0, tot:0, anios:new Set()
    };
    const m = map[r.cedula];
    MONTH_KEYS.forEach(k => m[k] += r[k]);
    m.agu += r.agu;
    m.tot += r.tot;
    m.anios.add(r.anio);
    if (r.nombre) m.nombre = r.nombre; // último visto
  });
  return Object.values(map).map(m => ({...m, anios:[...m.anios].sort().join(',')}));
}

function renderPagination(id, current, total, onClick){
  if (total <= 1){ $('#'+id).innerHTML = ''; return; }
  const items = [];
  const add = (p, label, opts={}) => items.push(
    `<li class="page-item ${opts.active?'active':''} ${opts.disabled?'disabled':''}">
      <a class="page-link" href="#" data-page="${p}">${label||p}</a></li>`);
  add(current-1, '«', {disabled:current===1});
  let s = Math.max(1, current-2), e = Math.min(total, current+2);
  if (s > 1){ add(1); if (s>2) items.push('<li class="page-item disabled"><span class="page-link">…</span></li>'); }
  for (let i=s; i<=e; i++) add(i, null, {active:i===current});
  if (e < total){ if (e<total-1) items.push('<li class="page-item disabled"><span class="page-link">…</span></li>'); add(total); }
  add(current+1, '»', {disabled:current===total});
  const ul = $('#'+id);
  ul.innerHTML = items.join('');
  ul.querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const p = parseInt(a.dataset.page);
    if (p>=1 && p<=total) onClick(p);
  }));
}

function exportRankingCSV(){
  const year = getYear();
  const res = year ? filterResumen(year) : aggregateAcrossYears();
  const sorted = [...res].sort((a,b)=>b.tot-a.tot);
  const headers = ['rank','cedula','nombre',...MONTH_KEYS,'aguinaldo','total_anual'];
  if (!year) headers.push('anios_presentes');
  const rows = sorted.map((r,i) => {
    const base = [i+1, r.cedula, '"'+r.nombre.replace(/"/g,'""')+'"',
      r.ene,r.feb,r.mar,r.abr,r.may,r.jun,r.jul,r.ago,r.sep,r.oct,r.nov,r.dic,r.agu,r.tot];
    if (!year) base.push(r.anios || '');
    return base.join(',');
  });
  const csv = headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ranking_${year||'todos'}.csv`;
  a.click();
}

// --- Search ---
function renderSearch(){
  $('#search-input').value = '';
  $('#search-results').innerHTML = '';
  $('#search-detail').innerHTML = '';
  $('#search-input').focus();
}
$('#search-input').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  if (q.length < 2){ $('#search-results').innerHTML = ''; return; }
  const matches = [];
  for (const [ced, nombre] of Object.entries(PERSONAS)){
    if (nombre.toLowerCase().includes(q) || ced.includes(q)){
      matches.push({cedula:ced, nombre});
      if (matches.length >= 50) break;
    }
  }
  $('#search-results').innerHTML = matches.map(m =>
    `<div class="search-result-item" data-cedula="${m.cedula}">
      <div><div class="name">${m.nombre}</div><div class="meta">CI ${m.cedula}</div></div>
      <i class="bi bi-chevron-right text-muted"></i>
    </div>`).join('') || '<div class="p-3 text-muted">Sin resultados</div>';
  $$('.search-result-item').forEach(item => {
    item.addEventListener('click', () => showDetailInPage(item.dataset.cedula));
  });
});

function showDetailInPage(cedula){
  $('#search-results').innerHTML = '';
  $('#search-input').value = '';
  $('#search-detail').innerHTML = renderDetailHtml(cedula);
  setTimeout(()=>renderDetailCharts(cedula), 50);
}
function showDetail(cedula, anio){
  $('#detail-title').textContent = PERSONAS[cedula] || `CI ${cedula}`;
  $('#detail-body').innerHTML = renderDetailHtml(cedula);
  const modal = new bootstrap.Modal('#detail-modal');
  modal.show();
  setTimeout(()=>renderDetailCharts(cedula), 200);
}

function renderDetailHtml(cedula){
  const nombre = PERSONAS[cedula] || `CI ${cedula}`;
  const data = RESUMEN.filter(r => r.cedula === cedula).sort((a,b)=>a.anio-b.anio);
  if (!data.length) return `<div class="alert alert-warning">Sin datos para ${cedula}</div>`;
  const totalAcum = data.reduce((a,b)=>a+b.tot,0);
  const aniosPresentes = data.map(r=>r.anio).join(', ');

  return `
    <div class="detail-section">
      <h4>${nombre}</h4>
      <div class="text-muted">Cédula: <code>${cedula}</code> · Años: ${aniosPresentes}</div>
      <div class="detail-grid">
        <div class="detail-cell"><div class="label">Total acumulado</div><div class="value">${fmtShort(totalAcum)}</div></div>
        ${data.map(r => `<div class="detail-cell">
          <div class="label">${r.anio}</div>
          <div class="value">${fmtShort(r.tot)}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="detail-section">
      <h6>Evolución mensual por año</h6>
      <canvas id="detail-chart-mensual" height="100"></canvas>
    </div>
    <div class="detail-section">
      <h6>Conceptos cobrados (acumulado)</h6>
      <canvas id="detail-chart-conceptos" height="100"></canvas>
    </div>
    <div class="detail-section">
      <h6>Detalle por mes y concepto</h6>
      <div class="table-responsive" style="max-height:400px">
        <table class="table table-sm table-striped">
          <thead class="sticky-top bg-light"><tr><th>Año</th><th>Mes</th><th>Concepto</th><th>Denominación</th><th class="text-end">Monto</th></tr></thead>
          <tbody id="detail-rows"></tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDetailCharts(cedula){
  const data = RESUMEN.filter(r => r.cedula === cedula).sort((a,b)=>a.anio-b.anio);
  // mensual por año
  if ($('#detail-chart-mensual')){
    makeChart('detail-chart-mensual', {
      type:'line',
      data:{
        labels:MONTHS,
        datasets:data.map((r,i) => ({
          label:r.anio,
          data:MONTH_KEYS.map(k=>r[k]),
          borderColor:COLORS[i],
          backgroundColor:COLORS[i]+'20',
          tension:.3,
          fill:false,
        }))
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y)}`}}},
        scales:{y:{ticks:{callback:v=>fmtShort(v)}}}
      }
    });
  }
  // conceptos
  const pagosPersona = PAGOS.filter(r => r[2] === cedula);
  const concSum = {};
  pagosPersona.forEach(r => {
    const c = r[4]; if (!c) return;
    concSum[c] = (concSum[c]||0) + r[6];
  });
  if ($('#detail-chart-conceptos')){
    const sorted = Object.entries(concSum).sort((a,b)=>b[1]-a[1]);
    makeChart('detail-chart-conceptos', {
      type:'bar',
      data:{
        labels:sorted.map(([c]) => `${c} - ${(CONCEPTOS[c]||'').slice(0,30)}`),
        datasets:[{data:sorted.map(([_,v])=>v), backgroundColor:COLORS, borderRadius:6}]
      },
      options:{
        indexAxis:'y',
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>fmt(c.parsed.x)}}},
        scales:{x:{ticks:{callback:v=>fmtShort(v)}}}
      }
    });
  }
  // tabla detalle
  if ($('#detail-rows')){
    const rows = pagosPersona.filter(r => r[6] !== 0)
      .sort((a,b) => a[0]-b[0] || a[1]-b[1])
      .slice(0, 500);
    $('#detail-rows').innerHTML = rows.map(r => {
      const mes = r[5] === 'A' ? 'AGUINALDO' : MONTHS[r[1]-1];
      return `<tr><td>${r[0]}</td><td>${mes}</td><td><code>${r[4]}</code></td>
        <td>${CONCEPTOS[r[4]] || '—'}</td>
        <td class="text-end num">${fmt(r[6])}</td></tr>`;
    }).join('');
  }
}

// --- Por concepto ---
function renderConcepto(){
  const year = getYear();
  const sums = {};
  filterPagos(year).forEach(r => {
    const c = r[4]; if (!c) return;
    sums[c] = (sums[c]||0) + r[6];
  });
  const sorted = Object.entries(sums).sort((a,b)=>b[1]-a[1]);
  const total = sorted.reduce((a,[_,v])=>a+v, 0);

  makeChart('chart-concepto-barras', {
    type:'bar',
    data:{
      labels:sorted.map(([c])=>`${c} - ${(CONCEPTOS[c]||'').slice(0,30)}`),
      datasets:[{
        data:sorted.map(([_,v])=>v),
        backgroundColor:COLORS.concat(COLORS).slice(0,sorted.length),
        borderRadius:6,
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>fmt(c.parsed.x)}}},
      scales:{x:{ticks:{callback:v=>fmtShort(v)}}}
    }
  });

  $('#concepto-table tbody').innerHTML = sorted.map(([c, v]) => `
    <tr>
      <td><code>${c}</code></td>
      <td>${CONCEPTOS[c] || '—'}</td>
      <td class="text-end num">${fmtShort(v)}</td>
      <td class="text-end num">${(v/total*100).toFixed(1)}%</td>
    </tr>
  `).join('');
}

// --- Por estado ---
function renderEstado(){
  const year = getYear();
  const personasPorEstado = {P:new Set(), C:new Set(), X:new Set()};
  filterPagos(year).forEach(r => {
    if (personasPorEstado[r[3]]) personasPorEstado[r[3]].add(r[2]);
  });
  $('#stat-perm').textContent = personasPorEstado.P.size;
  $('#stat-cont').textContent = personasPorEstado.C.size;
  $('#stat-com').textContent = personasPorEstado.X.size;

  // evolución por estado año a año
  const labels = META.anios;
  const datasets = [
    {label:'Permanente', estado:'P', color:'#10b981'},
    {label:'Contratado', estado:'C', color:'#f59e0b'},
    {label:'Comisionado', estado:'X', color:'#8b5cf6'},
  ].map(d => {
    const data = labels.map(y => {
      const personas = new Set();
      PAGOS.forEach(r => { if (r[0]===y && r[3]===d.estado) personas.add(r[2]); });
      return personas.size;
    });
    return {label:d.label, data, backgroundColor:d.color, borderRadius:6};
  });

  makeChart('chart-estado-evol', {
    type:'bar',
    data:{labels, datasets},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top'}},
      scales:{y:{beginAtZero:true, title:{display:true, text:'cantidad de personas'}}}
    }
  });
}

// --- Evolución ---
function renderEvolucion(){
  const year = getYear();

  // mensual: si año específico, mes a mes; si todos, año-año
  if (year){
    const mesSum = Array(12).fill(0);
    filterPagos(year).forEach(r => {
      if (r[1] >= 1 && r[1] <= 12) mesSum[r[1]-1] += r[6];
    });
    makeChart('chart-evolucion-mensual', {
      type:'line',
      data:{labels:MONTHS, datasets:[{
        label:'Total mensual', data:mesSum,
        borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,.1)',
        tension:.35, fill:true,
      }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{tooltip:{callbacks:{label:c=>fmt(c.parsed.y)}}},
        scales:{y:{ticks:{callback:v=>fmtShort(v)}}}
      }
    });
  } else {
    // un dataset por año, eje X meses
    const datasets = META.anios.map((y, i) => {
      const data = Array(12).fill(0);
      PAGOS.forEach(r => { if (r[0]===y && r[1]>=1 && r[1]<=12) data[r[1]-1] += r[6]; });
      return {label:y, data, borderColor:COLORS[i], backgroundColor:COLORS[i]+'20', tension:.3, fill:false};
    });
    makeChart('chart-evolucion-mensual', {
      type:'line',
      data:{labels:MONTHS, datasets},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y)}`}}},
        scales:{y:{ticks:{callback:v=>fmtShort(v)}}}
      }
    });
  }

  // top 5 evolución a 4 años
  const aggMap = {};
  RESUMEN.forEach(r => {
    if (!aggMap[r.cedula]) aggMap[r.cedula] = {nombre:r.nombre, byYear:{}, total:0};
    aggMap[r.cedula].byYear[r.anio] = r.tot;
    aggMap[r.cedula].total += r.tot;
  });
  const top5 = Object.values(aggMap).sort((a,b)=>b.total-a.total).slice(0,5);
  makeChart('chart-top5-evol', {
    type:'line',
    data:{
      labels:META.anios,
      datasets:top5.map((p, i) => ({
        label:p.nombre.length>30 ? p.nombre.slice(0,28)+'…' : p.nombre,
        data:META.anios.map(y => p.byYear[y] || 0),
        borderColor:COLORS[i], backgroundColor:COLORS[i]+'20',
        tension:.3,
      }))
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y)}`}}},
      scales:{y:{ticks:{callback:v=>fmtShort(v)}}}
    }
  });
}

// --- Datos crudos ---
let datosPage = 1;
const DATOS_PAGE_SIZE = 50;
function renderDatos(){
  const year = getYear();
  const search = ($('#datos-search').value || '').toLowerCase().trim();
  let pagos = filterPagos(year).filter(r => r[6] !== 0);
  if (search){
    pagos = pagos.filter(r => {
      const nom = (PERSONAS[r[2]] || '').toLowerCase();
      const den = (CONCEPTOS[r[4]] || '').toLowerCase();
      return nom.includes(search) || r[2].includes(search) ||
             r[4]?.includes(search) || den.includes(search);
    });
  }
  const total = pagos.length;
  const totalPages = Math.max(1, Math.ceil(total / DATOS_PAGE_SIZE));
  if (datosPage > totalPages) datosPage = 1;
  const start = (datosPage-1) * DATOS_PAGE_SIZE;
  const page = pagos.slice(start, start + DATOS_PAGE_SIZE);

  $('#datos-table tbody').innerHTML = page.map(r => {
    const mes = r[5] === 'A' ? 'AGUINALDO' : MONTHS[r[1]-1] || '—';
    const nombre = PERSONAS[r[2]] || '—';
    const den = CONCEPTOS[r[4]] || '—';
    return `<tr>
      <td>${r[0]}</td>
      <td>${mes}</td>
      <td><code>${r[2]}</code></td>
      <td>${nombre}</td>
      <td><span class="badge-estado badge-${r[3]}">${META.estados[r[3]]||r[3]}</span></td>
      <td><code>${r[4]||''}</code></td>
      <td>${den}</td>
      <td>${r[5]==='A'?'Aguinaldo':'Mensual'}</td>
      <td class="text-end num">${fmt(r[6])}</td>
    </tr>`;
  }).join('');

  $('#datos-info').textContent = `Mostrando ${start+1}-${Math.min(start+DATOS_PAGE_SIZE,total)} de ${total.toLocaleString('es-PY')}`;
  renderPagination('datos-pagination', datosPage, totalPages, p => { datosPage = p; renderDatos(); });
}
$('#datos-search').addEventListener('input', () => { datosPage = 1; renderDatos(); });

// ===== INIT =====
function initApp(){
  // sin async; PAGOS, RESUMEN, etc. vienen de data.js
  renderView('overview');
}
