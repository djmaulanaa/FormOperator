import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// --- KONFIGURASI ---
const supabaseUrl = 'https://ounyjjhwbqttjrtsmtjw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bnlqamh3YnF0dGpydHNtdGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzE1MzYsImV4cCI6MjA4OTkwNzUzNn0.0wgVlGfJEbDpjyH_eZKJt5OCgyB99WzgO-XGC4BGyl4'
const imgbbKey = '14653af6d80ef10cec6a24071b5ae1fd' // <-- GANTI INI!

const supabase = createClient(supabaseUrl, supabaseKey)

// Setting batasan tanggal (Max 2 hari kebelakang)
const tglInput = document.getElementById('tanggal')
const today = new Date()
const minDate = new Date()
minDate.setDate(today.getDate() - 2)
tglInput.min = minDate.toISOString().split('T')[0]
tglInput.max = today.toISOString().split('T')[0]

const form = document.getElementById('revisiForm')
const btnSubmit = document.getElementById('btnSubmit')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  btnSubmit.disabled = true
  btnSubmit.innerText = 'Sedang Mengupload Foto...'
  btnSubmit.classList.replace('bg-blue-600', 'bg-gray-400')

  const fd = new FormData(form)
  const fileFoto = fd.get('foto')
  // ambil waktu device user
  const createdAt = new Date().toISOString() // format ISO 8601, cocok ke Postgres

  // ambil multiple checkbox (jenis revisi)
  const revisions = fd.getAll('revision').join(', ')

  // ambil value mentah
  const ritasi = fd.get('ritasi')
  const jarak = fd.get('jarak')
  const smuStart = fd.get('smuStart')
  const smuEnd = fd.get('smuEnd')

    // Validasi sesuai checkbox
  if (revisions.includes('ritasi') && (!ritasi || ritasi.trim() === "")) {
    alert("Ritasi Actual wajib diisi karena Ritasi dicentang")
    return
  }

  if (revisions.includes('jarak') && (!jarak || jarak.trim() === "")) {
    alert("Jarak Actual wajib diisi karena Jarak dicentang")
    return
  }

  if (revisions.includes('SMU') && (!smuStart || smuStart.trim() === "" || !smuEnd || smuEnd.trim() === "")) {
    alert("SMU Start & End wajib diisi karena SMU dicentang")
    return
  }

  try {
    // =========================
    // 1. UPLOAD KE IMGBB
    // =========================
    const imgFormData = new FormData()
    imgFormData.append('image', fileFoto)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
      method: 'POST',
      body: imgFormData
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error('Gagal upload ke ImgBB: ' + result.error.message)
    }

    const foto_url = result.data.url
    btnSubmit.innerText = 'Menyimpan Data ke Database...'

    // =========================
    // 2. INSERT KE SUPABASE
    // =========================
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

        // ✅ FIX: biar tidak NaN & optional
        RitationAct: ritasi && ritasi !== "" ? Number(ritasi) : null,
        DistanceAct: jarak && jarak !== "" ? Number(jarak) : null,
        SMUStart: smuStart && smuStart !== "" ? Number(smuStart) : null,
        SMUEnd: smuEnd && smuEnd !== "" ? Number(smuEnd) : null,

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
    btnSubmit.disabled = false
    btnSubmit.innerText = 'Kirim'
    btnSubmit.classList.replace('bg-gray-400', 'bg-blue-600')
  }
})