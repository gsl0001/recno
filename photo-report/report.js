'use strict';
const photos = [];
const $ = id => document.getElementById(id);
const now = new Date();
$('date').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
function element(tag, text, className) { const node = document.createElement(tag); if(text !== undefined) node.textContent = text; if(className) node.className = className; return node; }
function draw() {
  $('output').replaceChildren(); $('output').classList.remove('visible');
  $('cards').replaceChildren();
  photos.forEach((photo, index) => {
    const card = element('article', undefined, 'card');
    const image = element('img'); image.src = photo.url; image.alt = `Report photo ${index+1}`;
    const label = element('label', `Photo ${index+1} — what should the reader notice?`);
    const caption = element('textarea'); caption.rows = 2; caption.maxLength = 1000; caption.value = photo.caption;
    caption.addEventListener('input', () => { photo.caption = caption.value; }); label.append(caption);
    const remove = element('button', `Remove photo ${index+1}`, 'remove'); remove.type = 'button';
    remove.addEventListener('click', () => { URL.revokeObjectURL(photo.url); photos.splice(index,1); draw(); $('status').textContent = `${photos.length} photos ready.`; });
    card.append(image,label,remove); $('cards').append(card);
  });
  $('print').disabled = photos.length === 0;
  $('preview').disabled = photos.length === 0;
}
$('photos').addEventListener('change', async event => {
  const input = event.target; const files = [...input.files]; input.disabled = true; const errors=[];
  for(const file of files) {
    if(photos.length >= 12) { errors.push('Maximum 12 photos per report.'); break; }
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 15*1024*1024) { errors.push(`${file.name}: use JPG, PNG or WebP under 15 MB.`); continue; }
    const url = URL.createObjectURL(file); const image = new Image(); image.src = url;
    try { await image.decode(); photos.push({url, caption:''}); } catch { URL.revokeObjectURL(url); errors.push(`${file.name}: could not read this image.`); }
  }
  input.value = ''; input.disabled = false; draw(); $('status').textContent = [`${photos.length} photos ready.`, ...errors].join(' ');
});
function buildReport() {
  const output = $('output'); output.replaceChildren();
  const head = element('header',undefined,'report-head');
  head.append(element('h1',$('job').value.trim() || 'Jobsite photo report'),element('p',[$('author').value.trim(),$('date').value].filter(Boolean).join(' · ')),element('p',$('summary').value)); output.append(head);
  photos.forEach((photo,index) => { const figure=element('figure',undefined,'report-photo'); const image=element('img'); image.src=photo.url; image.alt=`Photo ${index+1}`; figure.append(image,element('figcaption',`${index+1}. ${photo.caption}`)); output.append(figure); });
  const credit=element('p','Created with the free Recno photo report tool · ','report-credit'); const link=element('a','Get Recno for iPhone'); link.href='https://apps.apple.com/us/app/recno/id6785280739'; credit.append(link); output.append(credit);
}
$('preview').addEventListener('click', () => {
  buildReport(); $('output').classList.add('visible'); $('output').scrollIntoView({behavior:'smooth'});
});
$('print').addEventListener('click', async () => {
  buildReport();
  try { await Promise.all([...$('output').querySelectorAll('img')].map(image=>image.decode())); window.print(); }
  catch { $('status').textContent = 'A photo could not be prepared. Remove it and add it again before printing.'; }
});
window.addEventListener('beforeprint', buildReport);
