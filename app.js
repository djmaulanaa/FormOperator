import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ================= CONFIG =================
const supabaseUrl = 'https://ounyjjhwbqttjrtsmtjw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bnlqamh3YnF0dGpydHNtdGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzE1MzYsImV4cCI6MjA4OTkwNzUzNn0.0wgVlGfJEbDpjyH_eZKJt5OCgyB99WzgO-XGC4BGyl4'
const imgbbKey = '14653af6d80ef10cec6a24071b5ae1fd' // <-- GANTI INI!

const supabase = createClient(supabaseUrl, supabaseKey)

// ================= ELEMENT =================
const form = document.getElementById('revisiForm')
const btnSubmit = document.getElementById('btnSubmit')
const tglInput = document.getElementById('tanggal')

// ================= DATE SETUP =================
const today = new Date()
const minDate = new Date()
minDate.setDate(today.getDate() - 2)

tglInput.min = minDate.toISOString().split('T')[0]
tglInput.max = today.toISOString().split('T')[0]

// ================= HELPER =================
function resetBtn() {
  btnSubmit.disabled = false
  btnSubmit.innerText = 'Kirim'
  btnSubmit.classList.replace('bg-gray-400', 'bg-blue-600')
}

// ================= SUBMIT =================
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  btnSubmit.disabled = true
  btnSubmit.innerText = 'Sedang Mengupload Foto...'
  btnSubmit.classList.replace('bg-blue-600', 'bg-gray-400')

  const fd = new FormData(form)
  const fileFoto = fd.get('foto')
  const createdAt = new Date().toISOString()

  const revisionsArr = fd.getAll('revision')
  const revisions = revisionsArr.join(', ')

  const ritasi = fd.get('ritasi')
  const jarak = fd.get('jarak')
  const smuStart = fd.get('smuStart')
  const smuEnd = fd.get('smuEnd')

  // ================= VALIDASI TANGGAL (FIX MOBILE BUG) =================
  const selectedDate = new Date(fd.get('tanggal'))
  const min = new Date(minDate.toISOString().split('T')[0])
  const max = new Date(today.toISOString().split('T')[0])

  if (selectedDate < min || selectedDate > max) {
    alert("Tanggal hanya boleh 2 hari kebelakang sampai hari ini")
    resetBtn()
    return
  }

  // ================= VALIDASI CHECKBOX =================
  if (revisionsArr.length === 0) {
    alert("Pilih minimal 1 jenis revisi")
    resetBtn()
    return
  }

  // ================= VALIDASI FIELD =================
  if (revisions.includes('ritasi') && (!ritasi || ritasi.trim() === "")) {
    alert("Ritasi wajib diisi")
    resetBtn()
    return
  }

  if (revisions.includes('jarak') && (!jarak || jarak.trim() === "")) {
    alert("Jarak wajib diisi")
    resetBtn()
    return
  }

  if (revisions.includes('SMU') && (!smuStart || !smuEnd)) {
    alert("SMU wajib diisi")
    resetBtn()
    return
  }

  // ================= VALIDASI LOGIC =================
  if (smuStart && smuEnd && Number(smuEnd) <= Number(smuStart)) {
    alert("SMU End harus lebih besar dari SMU Start")
    resetBtn()
    return
  }

  try {
    // ================= UPLOAD IMAGE =================
    const imgFormData = new FormData()
    imgFormData.append('image', fileFoto)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
      method: 'POST',
      body: imgFormData
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error('Gagal upload gambar')
    }

    const foto_url = result.data.url
    btnSubmit.innerText = 'Menyimpan Data ke Database...'

    // ================= INSERT DB =================
    const { error } = await supabase
      .from('ComplainDataOperator')
      .insert([{
        DateRevision: fd.get('tanggal'),
        ShiftID: fd.get('shift'),
        SN: fd.get('sn'),
        Name: fd.get('nama'),
        RevisionType: revisions,
        PIT: fd.get('pit'),
        UnitType: fd.get('unitType'),
        UnitID: fd.get('unitID'),

        RitationAct: ritasi ? Number(ritasi) : null,
        DistanceAct: jarak ? Number(jarak) : null,
        SMUStart: smuStart ? Number(smuStart) : null,
        SMUEnd: smuEnd ? Number(smuEnd) : null,

        DisposalName: fd.get('disposal'),
        NoHP: fd.get('nohp'),
        Description: fd.get('desc'),
        Url: foto_url,
        created_at: createdAt
      }])

    if (error) throw error

    alert('Data Berhasil Terkirim!')
    form.reset()

  } catch (err) {
    console.error(err)
    alert('Terjadi Kesalahan: ' + err.message)
  } finally {
    resetBtn()
  }
})
