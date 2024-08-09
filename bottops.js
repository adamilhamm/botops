// Masukkan token bot Anda di sini
var token = '7204751271:AAGHJYUXhToEU0EXspcgh6whxRpmDMeDjo4';

// URL untuk API screenshot
var screenshotApiBaseUrl = 'https://shot.screenshotapi.net/screenshot';
var screenshotApiToken = 'X6KS5QJ-P0EMYBE-HX57FJB-WACE5EP';

// Buat objek baru untuk Telegram
var tg = new telegram.daftar(token);

// Untuk menyimpan jadwal dan ID grup, kita menggunakan PropertiesService
var properties = PropertiesService.getScriptProperties();

// Fungsi untuk menangani hanya menerima pesan berupa POST, jika GET keluarkan pesan error
function doGet(e) {
  return HtmlService.createHtmlOutput("Hanya data POST yang diproses.");
}

// Fungsi untuk menangani pesan POST
function doPost(e) {
  if (e.postData.type === "application/json") {
    try {
      var update = JSON.parse(e.postData.contents);
      if (update) {
        prosesPesan(update);
      }
    } catch (error) {
      Logger.log('Error parsing POST data: ' + error.message);
    }
  }
}

// Fungsi untuk mendapatkan tanggal dan waktu saat ini dengan format nama hari, tanggal, jam, menit
function getSysDate() {
  var now = new Date();
  var dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var dayName = dayNames[now.getDay()];
  var formattedDateTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var formattedTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
  return dayName + ", " + formattedDateTime + " " + formattedTime;
}

// Fungsi utama untuk menangani semua pesan
function prosesPesan(update) {
  try {
    if (update.message) {
      var msg = update.message;
      var chatId = msg.chat.id;
      var userId = msg.from.id;

      // Jika ada pesan berupa text
      if (msg.text) {
        // Menangani perintah /help
        if (/^\/help$/i.test(msg.text)) {
          var helpMessage = "Berikut adalah daftar perintah yang dapat Anda gunakan:\n\n" +
                            "/setpesanbc <pesan> - Menyimpan pesan untuk broadcast\n" +
                            "/lihatpesanbc - Menampilkan pesan broadcast yang disimpan\n" +
                            "/sendpesanbc - Mengirim pesan broadcast yang disimpan ke semua grup\n" +
                            "/jadwal - Menampilkan jadwal shift\n" +
                            "/setjadwal - Mengatur jadwal shift\n" +
                            "/lihatjadwal - Menampilkan jadwal shift Anda\n" +
                            "/sudahkah - Mengonfirmasi penerimaan pesan\n" +
                            "/capturemonitor <query> - Mengambil screenshot dari halaman pencarian Google\n" +
                            "/bcjadwal - Broadcast jadwal ke semua grup\n" +
                            "/listgroupadded - Menampilkan daftar grup yang sudah diikuti";
          return tg.kirimPesan(chatId, helpMessage, "Markdown");
        }

        // Menangani perintah /setpesanbc
        if (/^\/setpesanbc\s+/i.test(msg.text)) {
          var pesanBroadcast = msg.text.replace(/^\/setpesanbc\s*/, "").trim();
          var responseMessage = pesanBroadcast.length > 0 
            ? "Pesan broadcast telah disimpan." 
            : "Pesan broadcast tidak boleh kosong.";
          if (pesanBroadcast.length > 0) {
            properties.setProperty("broadcastMessage", pesanBroadcast);
          }
          return tg.kirimPesan(chatId, responseMessage, "Markdown");
        }

        // Menangani perintah /lihatpesanbc
        if (/^\/lihatpesanbc$/i.test(msg.text)) {
          var broadcastMessage = properties.getProperty("broadcastMessage");
          var displayMessage = broadcastMessage 
            ? "Pesan broadcast saat ini:\n\n" + broadcastMessage
            : "Belum ada pesan broadcast yang disimpan.";
          return tg.kirimPesan(chatId, displayMessage, "Markdown");
        }

        // Menangani perintah /sendpesanbc
        if (/^\/sendpesanbc$/i.test(msg.text)) {
          var broadcastMessage = properties.getProperty("broadcastMessage");
          var groups = properties.getProperty("groups");
          if (broadcastMessage && groups) {
            groups = JSON.parse(groups);
            var sysDate = getSysDate();
            for (var i = 0; i < groups.length; i++) {
              var messageWithDate = broadcastMessage + "\n\nTanggal dan Waktu Saat Ini: " + sysDate;
              tg.kirimPesan(groups[i], messageWithDate, "Markdown");
            }
            return tg.kirimPesan(chatId, "Pesan broadcast telah dikirimkan ke semua grup.", "Markdown");
          }
          var noMessageMessage = broadcastMessage ? "Belum ada grup yang terdaftar." : "Belum ada pesan broadcast yang disimpan.";
          return tg.kirimPesan(chatId, noMessageMessage, "Markdown");
        }

        // Menangani perintah /jadwal
        if (/^\/jadwal$/i.test(msg.text)) {
          var jadwalPesan = "Assalamualaikum\n\n*Berikut disampaikan Jadwal Shifting MO INSERA & BIMA*\n\n*================================*\n\n*Piket Shift 1 00:00-08:00*\n\n*Piket Shift 2 08:00-17:00*\n\n*Piket Shift 3 16:00-24:00*\n\n*Salam Hangat Dari Kami*\n\nTanggal dan Waktu Saat Ini: " + getSysDate();
          return tg.kirimPesan(chatId, jadwalPesan, "Markdown");
        }

        // Menangani perintah /setjadwal
        if (/^\/setjadwal$/i.test(msg.text)) {
          properties.setProperty("waitingForSchedule", userId);
          var requestScheduleMessage = "Silakan kirimkan jadwal Anda dalam format berikut:\n\nPiket Shift 1 00:00-08:00\nPiket Shift 2 08:00-17:00\nPiket Shift 3 16:00-24:00";
          return tg.kirimPesan(chatId, requestScheduleMessage);
        }

        // Menyimpan jadwal yang dikirim oleh pengguna
        if (properties.getProperty("waitingForSchedule") == userId && msg.text) {
          properties.deleteProperty("waitingForSchedule");
          properties.setProperty("schedule_" + userId, msg.text);
          return tg.kirimPesan(chatId, "Jadwal Anda telah diset:\n" + msg.text);
        }

        // Menangani perintah /lihatjadwal
        if (/^\/lihatjadwal$/i.test(msg.text)) {
          var savedSchedule = properties.getProperty("schedule_" + userId);
          var displayMessage = savedSchedule
            ? "Assalamualaikum\n\nBerikut disampaikan Jadwal Shifting MO INSERA & BIMA\n\n*================================*\n\n" + savedSchedule + "\n\nTanggal dan Waktu Saat Ini: " + getSysDate() + "\n\n*Jika mengalami kendala bisa melalui @hdsigmaniwbis*\n\n*Salam Hangat Dari Kami*"
            : "Anda belum menyimpan jadwal.";
          return tg.kirimPesan(chatId, displayMessage, "Markdown");
        }

        // Menangani perintah /sudahkah
        if (/^\/sudahkah$/i.test(msg.text)) {
          var startPesan = "Pesan diterima!\n\n*Lanjutkan Bro&Sis! habiskan SYGAPMU*\n\nTanggal dan Waktu Saat Ini: " + getSysDate();
          return tg.kirimPesan(chatId, startPesan, "Markdown");
        }

        // Menangani perintah /capturemonitor
        if (/^\/capturemonitor\s+(.*)$/i.test(msg.text)) {
          var query = encodeURIComponent(RegExp.$1.trim());
          var screenshotUrl = getScreenshotUrl(query);
          try {
            var response = UrlFetchApp.fetch(screenshotUrl);
            var contentType = response.getHeaders()['Content-Type'];
            Logger.log('Content-Type: ' + contentType); // Log content type
            
            if (contentType && contentType.startsWith('image/')) {
              var imageBlob = response.getBlob();
              var sendPhotoResponse = sendPhotoToTelegram(chatId, imageBlob);
              if (sendPhotoResponse) {
                return tg.kirimPesan(chatId, "Capture berhasil dikirim.\n\nTanggal dan Waktu Saat Ini: " + getSysDate());
              } else {
                return tg.kirimPesan(chatId, "Terjadi kesalahan saat mengirim gambar.");
              }
            } else {
              return tg.kirimPesan(chatId, "Terjadi kesalahan saat mengambil screenshot. Konten bukan gambar.");
            }
          } catch (e) {
            return tg.kirimPesan(chatId, "Terjadi kesalahan saat mengambil screenshot: " + e.message);
          }
        }

        // Menangani perintah /bcjadwal
        if (/^\/bcjadwal$/i.test(msg.text)) {
          var scheduleMessage = properties.getProperty("schedule_" + userId);
          var groups = properties.getProperty("groups");
          if (scheduleMessage && groups) {
            groups = JSON.parse(groups);
            var sysDate = getSysDate();
            for (var i = 0; i < groups.length; i++) {
              var messageWithDate = "Assalamualaikum\n\nBerikut disampaikan Jadwal Shifting MO INSERA & BIMA\n\n*================================*\n\n" + scheduleMessage + "\n\nTanggal dan Waktu Saat Ini: " + sysDate;
              tg.kirimPesan(groups[i], messageWithDate, "Markdown");
            }
            return tg.kirimPesan(chatId, "Jadwal telah dikirimkan ke semua grup.", "Markdown");
          }
          var noScheduleMessage = scheduleMessage ? "Belum ada grup yang terdaftar." : "Belum ada jadwal yang disimpan.";
          return tg.kirimPesan(chatId, noScheduleMessage, "Markdown");
        }

        // Menangani perintah /listgroupadded
        if (/^\/listgroupadded$/i.test(msg.text)) {
          var groups = properties.getProperty("groups");
          if (groups) {
            groups = JSON.parse(groups);
            if (groups.length > 0) {
              var groupList = "Daftar Grup yang Diikuti:\n\n";
              for (var i = 0; i < groups.length; i++) {
                groupList += "- " + groups[i] + "\n";
              }
              return tg.kirimPesan(chatId, groupList, "Markdown");
            } else {
              return tg.kirimPesan(chatId, "Bot belum mengikuti grup manapun.", "Markdown");
            }
          } else {
            return tg.kirimPesan(chatId, "Bot belum mengikuti grup manapun.", "Markdown");
          }
        }
      }

      // Fungsi handle user yang masuk ke grup
      if (msg.new_chat_member) { 
        var nama = msg.new_chat_member.first_name;
        if (msg.new_chat_member.last_name) { 
          nama += " " + msg.new_chat_member.last_name;
        }
        var teks = "Selamat datang, " + nama + ". Semoga kamu betah di sini ya!\n\nTanggal dan Waktu Saat Ini: " + getSysDate();
        tg.kirimPesan(msg.chat.id, teks);
        
        // Simpan ID grup saat bot ditambahkan ke grup
        var groups = properties.getProperty("groups");
        groups = groups ? JSON.parse(groups) : [];
        if (!groups.includes(msg.chat.id)) {
          groups.push(msg.chat.id);
          properties.setProperty("groups", JSON.stringify(groups));
        }
      }
    }
  } catch (error) {
    Logger.log('Error processing message: ' + error.message);
  }
}

// Fungsi untuk mendapatkan URL screenshot dengan query
function getScreenshotUrl(query) {
  return screenshotApiBaseUrl + '?token=' + screenshotApiToken + '&url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3D' + query + '&full_page=true&output=image&file_type=png&wait_for_event=load';
}

// Fungsi untuk mengirimkan foto ke Telegram
function sendPhotoToTelegram(chatId, imageBlob) {
  var url = "https://api.telegram.org/bot" + token + "/sendPhoto";
  var payload = {
    chat_id: chatId,
    photo: imageBlob
  };
  var options = {
    method: "POST",
    payload: payload,
    muteHttpExceptions: true // Untuk menangani kesalahan HTTP
  };
  try {
    var response = UrlFetchApp.fetch(url, options);
    Logger.log('SendPhoto response: ' + response.getContentText()); // Log response dari API
    return response.getContentText().includes('"ok":true');
  } catch (error) {
    Logger.log('Error sending photo: ' + error.message);
    return false;
  }
}

// Fungsi broadcast jadwal ke semua grup (berjalan secara terjadwal)
function broadcastSchedule() {
  try {
    var groups = properties.getProperty("groups");
    if (groups) {
      groups = JSON.parse(groups);
      var userIds = properties.getKeys().filter(function(key) {
        return key.startsWith('schedule_');
      }).map(function(key) {
        return key.replace('schedule_', '');
      });

      if (userIds.length > 0) {
        userIds.forEach(function(userId) {
          var scheduleMessage = properties.getProperty("schedule_" + userId);
          if (scheduleMessage) {
            var sysDate = getSysDate();
            for (var i = 0; i < groups.length; i++) {
              var messageWithDate = "Assalamualaikum\n\nBerikut disampaikan Jadwal Shifting MO INSERA & BIMA\n\n*================================*\n\n" + scheduleMessage + "\n\nTanggal dan Waktu Saat Ini: " + sysDate;
              tg.kirimPesan(groups[i], messageWithDate, "Markdown");
            }
          }
        });
      } else {
        Logger.log('Belum ada jadwal yang disimpan.');
      }
    }
  } catch (error) {
    Logger.log('Error broadcasting schedule: ' + error.message);
  }
}

// Fungsi untuk mengatur Trigger
function setupTriggers() {
  try {
    // Hapus semua trigger yang ada
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
    
    // Menambahkan trigger untuk broadcast jadwal ke semua grup setiap hari pada pukul 8, 16, dan 20
    ScriptApp.newTrigger('broadcastSchedule')
      .timeBased()
      .atHour(8)
      .everyDays(1)
      .create();
    
    ScriptApp.newTrigger('broadcastSchedule')
      .timeBased()
      .atHour(16)
      .everyDays(1)
      .create();
    
    ScriptApp.newTrigger('broadcastSchedule')
      .timeBased()
      .atHour(20)
      .everyDays(1)
      .create();
  } catch (error) {
    Logger.log('Error setting up triggers: ' + error.message);
  }
}
