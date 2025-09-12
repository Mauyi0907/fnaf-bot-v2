import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import { Boom } from "@hapi/boom"
import qrcode from "qrcode-terminal"
import ytdl from "@distube/ytdl-core"
import ytSearch from "yt-search"
import fs from "fs"
import pino from "pino"   // 📌 agregado

// 📂 Base de datos de usuarios
const usersFile = "./users.json"
let users = {}

// 🔄 Cargar usuarios
if (fs.existsSync(usersFile)) {
    try {
        const data = fs.readFileSync(usersFile, "utf8").trim()
        users = data ? JSON.parse(data) : {}
    } catch (err) {
        console.error("⚠️ Error al leer users.json:", err.message)
        users = {}
        fs.writeFileSync(usersFile, "{}")
    }
} else {
    fs.writeFileSync(usersFile, "{}")
}
// 🔖 Obtener rango según nivel
function getRank(level) {
    if (level < 1) return "👻 Alma"
    if (level < 5) return "🎈 Balloon Boy"
    if (level < 10) return "🐤 Chica"
    if (level < 15) return "🐰 Bonnie"
    if (level < 20) return "🦊 Foxy"
    if (level < 30) return "🐻 Freddy"
    if (level < 40) return "🪢 Springtrap"
    if (level < 50) return "🌑 Nightmare"
    if (level < 70) return "🎪 Circus Baby"
    return "👑 Glitchtrap"
}
//funcion para la tienda de rangos
function hasAccessToGame(user, requiredRank) {
    // Si el rango actual por nivel es suficiente
    if (getRank(user.level) === requiredRank) {
        return true
    }

    // Si el usuario tiene inventario y compró el rango
    if (user.inventory && user.inventory.includes(requiredRank)) {
        return true
    }

    // Si no cumple ninguna condición
    return false
}
//xp necesario para subir de xp
function getXPRequired(level) {
    if (level < 5) return 100   // Rango "👻 Alma"
    if (level < 10) return 200  // Rango "🎈 Balloon Boy"
    if (level < 20) return 400  // Rango "🐤 Chica"
    if (level < 30) return 600  //Rango Bonnie
    if (level < 40) return 800  // Rango "Foxy"
    if (level < 50) return 1500 // Rango "Freddy"
    if (level < 60) return 2500 // Rango "Golden Freddy"
    return 5000                 // Rangos superiores (Glitchtrap, etc.)
}



//XP necesaria para subir de nivel
function getXPNeeded(level) {
    return 100 + (level * 50) // Ejemplo: cada nivel requiere más XP
}

//Veruficar si existe el usuario 
function ensureUser(jid) {
    if (!economy[jid]) {
        economy[jid] = {
            fazcoins: 0,
            xp: 0,
            level: 0,
            inventory: [] // 📦 inventario de rangos comprados
        }
    } else {
        if (economy[jid].fazcoins === undefined) economy[jid].fazcoins = 0
        if (economy[jid].xp === undefined) economy[jid].xp = 0
        if (economy[jid].level === undefined) economy[jid].level = 0
        if (!Array.isArray(economy[jid].inventory)) economy[jid].inventory = [] // asegurar inventario
    }
}

// Guardar usuarios
function saveUsers() {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
}

// Verificar si está registrado
function isRegistered(jid) {
    return !!users[jid]
}

// Registrar usuario
function registerUser(jid, name) {
    if (!users[jid]) {
        users[jid] = { 
            name, 
            registeredAt: new Date().toISOString() 
        }
        saveUsers()
        return true
    }
    return false
}
// 📌 Lista ordenada de rangos
const rankOrder = [
    "👻 Alma",
    "🎈 Balloon Boy",
    "🐤 Chica",
    "🐰 Bonnie",
    "🦊 Foxy",
    "🐻 Freddy",
    "🪢 Springtrap",
    "🌑 Nightmare",
    "🎪 Circus Baby",
    "👑 Glitchtrap"
]

//Individuales Chica
const cupcakeRunGames = {}
const luzGames = {}
//Cooperativos Chica
const pizzaRaceGames = {}
const cocinaLocaGames = {}
const sobrevivirNocheGames = {}
//Juegos Individuales Bonnie
const bonnieMusicGames = {}
const bonnieGuitarGames = {}
const bonnieFlashlightGames = {}
//Juegos Cooperativos Bonnie
const bonnieDuoGames = {}
const bonnieBandGames = {}
const bonnieTuneGames = {} 
//Juegos individuales Foxy
const carreraFoxyGames = {}
const tesoroFoxyGames = {}
const emboscadaFoxyGames = {}
//Juegos cooperativos Foxy
const barcoFoxyGames = {}
const cazaFoxyGames = {}
const batallaFoxyGames = {}

const sombrasGames = {}
const campanasGames = {}
//Juegos Cooperativos Freddy
const puertasFreddyGames = {}
const ritualFreddyGames = {}









// 🎮 Estado de las partidas de TicTacToe
const tictactoeGames = {}
// 🎮 Estado del minijuego Plushtrap
const plushtrapGames = {}
// 🎮 Estado de las entrevistas
const entrevistasActivas = {}
// 🎮 Estado del minijuego Helado
const heladoGames = {}
//Estado del minijuego Springtrap
const escapeGames = {}
//Estado del minijuego de escondite
const esconditeGames = {}
//Estado del minijuego de Eco
const ecoGames = {}
const ballonRaceGames = {}      // carrera de globos 🎈
const risasDuoGames = {}        // concurso de risas en pareja 🤣
const globosVsFreddyGames = {}  // defender globos de Freddy 🐻

// 💰 Economía
let economy = {}
const economyFile = "./economy.json"

// ⚙️ Número del admin
const ADMIN_JID = "89460142252195@lid" // 👈 cámbialo por tu número con @s.whatsapp.net

// 🔗 Avatar por defecto
const DEFAULT_AVATAR_URL = "https://i.imgur.com/1XKpA4J.png"

// Cargar economía desde archivo
if (fs.existsSync(economyFile)) {
    try {
        const data = fs.readFileSync(economyFile, "utf8").trim()
        economy = data ? JSON.parse(data) : {}
    } catch (err) {
        console.error("⚠️ Error al leer economy.json:", err.message)
        economy = {}
        fs.writeFileSync(economyFile, "{}")
    }
} else {
    fs.writeFileSync(economyFile, "{}")
}

function saveEconomy() {
    fs.writeFileSync(economyFile, JSON.stringify(economy, null, 2))
}

function getName(sender, msg) {
    if (msg && msg.pushName) return msg.pushName
    if (msg && msg.notify) return msg.notify
    if (sender) return sender.split("@")[0] // fallback
    return "Desconocido"
}


// Emojis de números
const numEmojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"]
function renderBoard(board) {
    return `
${board[0]} | ${board[1]} | ${board[2]}
---------
${board[3]} | ${board[4]} | ${board[5]}
---------
${board[6]} | ${board[7]} | ${board[8]}
`
}
function checkWinner(board, player) {
    const winPatterns = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ]
    return winPatterns.some(pattern => pattern.every(i => board[i] === player))
}


//subir automaticamente de nivel.
async function addXP(sender, amount, sock, from) {
    ensureUser(sender)
    const user = economy[sender]

    const oldRank = getRank(user.level) // rango antes de subir
    user.xp += amount

    let leveledUp = false

    while (user.xp >= getXPRequired(user.level)) {
        user.xp -= getXPRequired(user.level)
        user.level++
        leveledUp = true
    }

    // 🔹 Guardar los cambios en economy.json
    saveEconomy()

    if (leveledUp) {
        const newRank = getRank(user.level)

        if (oldRank !== newRank) {
            // 📌 Cambió de rango
            await sock.sendMessage(from, {
                text: `🎉 ¡${getName(sender)} ha subido al *nivel ${user.level}*!\nNuevo rango: *${newRank}*`
            })
        } else {
            // 📌 Solo subió de nivel, sin rango nuevo
            await sock.sendMessage(from, {
                text: `⭐ ¡${getName(sender)} ha subido al *nivel ${user.level}*!`
            })
        }
    }
}



// 🛡️ Resolver avatar
async function resolveAvatarUrl(sock, jid) {
    try {
        const url = await sock.profilePictureUrl(jid, "image")
        if (!url || /i\.ibb\.co/i.test(url)) {
            return DEFAULT_AVATAR_URL
        }
        return url
    } catch {
        return DEFAULT_AVATAR_URL
    }
}
async function sendImageSafe(sock, to, url, caption) {
    try {
        await sock.sendMessage(to, { image: { url }, caption })
    } catch (e) {
        await sock.sendMessage(to, { text: caption })
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info")
    const sock = makeWASocket({ 
        auth: state,
        logger: pino({ level: "error" })
    })

    sock.ev.on("creds.update", saveCreds)
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) qrcode.generate(qr, { small: true })

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            console.log("✅ Bot conectado")
        }
    })

    // 🎭 Escuchar reacciones
    sock.ev.on("messages.upsert", async (msgUpsert) => {
        const msg = msgUpsert.messages[0]
        if (!msg.message?.reactionMessage) return

        const from = msg.key.remoteJid
        const reaccion = msg.message.reactionMessage.text
        const reaccionador = msg.key.participant

        if (heladoGames[from]?.esperandoReaccion) {
            const { player, amigo } = heladoGames[from]

            if (reaccionador === amigo) {
                if (reaccion === "❤️") {
                    await sock.sendMessage(from, { 
                        text: `😋 ¡@${amigo.split("@")[0]} recibió el helado y le encantó! 🍦❤️`,
                        mentions: [amigo, player]
                    })
                } else if (reaccion === "👎") {
                    await sock.sendMessage(from, { 
                        text: `🤢 @${amigo.split("@")[0]} dice que el helado de @${player.split("@")[0]} no le gustó.`,
                        mentions: [amigo, player]
                    })
                }
                delete heladoGames[from]
            }
        }
    })

  

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return

        const from = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""

 // 📈 Cada mensaje da XP SOLO si el usuario está en rango Alma
if (isRegistered(sender)) { 
    ensureUser(sender)
    if (getRank(economy[sender].level) === "👻 Alma") {
        const xpGanada = Math.floor(Math.random() * 8) + 3 // entre 3 y 10 XP
        await addXP(sender, xpGanada, sock, from)
    }
}

         // ⚠️ Verificar registro SOLO si es un comando (!)
if (text.startsWith("!") && !isRegistered(sender) && !text.toLowerCase().startsWith("!registrar")) {
    return await sock.sendMessage(from, { 
        text: "⚠️ No estás registrado.\n👉 Usa *!registrar* para empezar a usar el bot." 
    })
}

// 🎯 Comando para registrarse
if (text.toLowerCase() === "!registrar") {
    const name = msg.pushName || "Usuario"
    if (registerUser(sender, name)) {
        await sock.sendMessage(from, { 
            text: `✅ Registro completado.\nBienvenido, *${name}*! 🎉` 
        })
    } else {
        await sock.sendMessage(from, { 
            text: "⚠️ Ya estás registrado." 
        })
    }
    return
}

// 🎮 ESCAPE DE SPRINGTRAP
if (text.toLowerCase() === "!springtrap") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🪢 Springtrap")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🪢 Springtrap." })
    }

    if (escapeGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes un Escape de Springtrap activo aquí." })
    }

    escapeGames[from] = { fase: 0, player: sender }

    await sock.sendMessage(from, { 
        image: { url: "./media/springtrap/1_lejos.jpg" }, 
        caption: "👻 *Escape de Springtrap* 👻\nSpringtrap viene hacia ti...\nEscribe *!escape* para intentar huir." 
    })

    escapeGames[from].interval = setInterval(async () => {
        const game = escapeGames[from]
        if (!game) return

        game.fase++

        const imgMap = {
            1: "./media/springtrap/1_lejos.jpg",
            2: "./media/springtrap/2_cerca.jpg",
            3: "./media/springtrap/3_muycerca.jpg"
        }

        // 💀 Jumpscare en fase final
        if (game.fase >= 3) {
            await sock.sendMessage(from, { 
                video: { url: "./media/springtrap/jumpscare.gif" }, 
                gifPlayback: true,
                caption: "💀 ¡Springtrap te atrapó!"
            })
            clearInterval(game.interval)
            delete escapeGames[from]
            return
        }

        // 📸 Mostrar imagen de la fase
        await sock.sendMessage(from, { 
            image: { url: imgMap[game.fase] }, 
            caption: "⚠️ ¡Springtrap se acerca! Usa *!escape* para huir." 
        })
    }, 7000) // cada 7 segundos se mueve
}

// 🏃‍♂️ Comando para escapar
if (text.toLowerCase() === "!escape") {
    const game = escapeGames[from]
    if (!game) {
        return await sock.sendMessage(from, { text: "❌ No tienes un Escape de Springtrap activo. Usa *!springtrap* para empezar." })
    }

    // Si ya está en fase final → jumpscare
    if (game.fase >= 3) {
        await sock.sendMessage(from, { 
            video: { url: "./media/springtrap/jumpscare.gif" }, 
            gifPlayback: true,
            caption: "💀 ¡Springtrap te atrapó!"
        })
        clearInterval(game.interval)
        delete escapeGames[from]
        return
    }

    // ✅ Escapó correctamente
    clearInterval(game.interval)
    ensureUser(sender)
    economy[sender].fazcoins += 15
    await addXP(sender, 20, sock, from) // XP al escapar
    saveEconomy()

    await sock.sendMessage(from, { 
        image: { url: "./media/springtrap/escape.jpg" }, 
        caption: "🏃‍♂️ ¡Escapaste de Springtrap!\nGanaste *15 Fazcoins* 💰 y *20 XP* ⭐" 
    })

    delete escapeGames[from]
}

// 👉 Comando para probar subida de nivel
if (text.toLowerCase().startsWith("!probarnivel")) {
    ensureUser(sender)

    const args = text.split(" ")
    let xp = parseInt(args[1]) || 400 // Por defecto da 50 XP si no pones número

    await addXP(sender, xp, sock, from)

    await sock.sendMessage(from, { 
        text: `📈 Se te añadieron *${xp} XP* para pruebas.` 
    })
}

// 📦 TIENDA DE RANGOS
if (text.toLowerCase() === "!tienda") {
    let storeText = "🏪 *Tienda de Helpy*\n\n"
    storeText += "🎈 Balloon Boy - 50 Fazcoins\n"
    storeText += "🐤 Chica - 100 Fazcoins\n"
    storeText += "🐰 Bonnie - 200 Fazcoins\n"
    storeText += "🦊 Foxy - 300 Fazcoins\n"
    storeText += "🐻 Freddy - 400 Fazcoins\n"
    storeText += "🪢 Springtrap - 600 Fazcoins\n"
    storeText += "🌑 Nightmare - 800 Fazcoins\n"
    storeText += "🎪 Circus Baby - 1000 Fazcoins\n"
    storeText += "👑 Glitchtrap - 1500 Fazcoins\n\n"
    storeText += "💳 Usa *!comprar [nombre del rango]* para comprar."

    await sock.sendMessage(from, { text: storeText })
}

// 📦 COMPRAR RANGO
if (text.toLowerCase().startsWith("!comprar ")) {
    ensureUser(sender)
    const user = economy[sender]
    const currentRank = getRank(user.level)

    const args = text.split(" ")
    const rango = args.slice(1).join(" ")

    const precios = {
        "🎈 Balloon Boy": 50,
        "🐤 Chica": 100,
        "🐰 Bonnie": 200,
        "🦊 Foxy": 350,
        "🐻 Freddy": 500,
        "🪢 Springtrap": 800,
        "🌑 Nightmare": 1200,
        "🎪 Circus Baby": 2000,
        "👑 Glitchtrap": 5000
    }

    // Nivel requerido para cada rango
    const requiredLevel = {
        "🎈 Balloon Boy": 1,
        "🐤 Chica": 5,
        "🐰 Bonnie": 10,
        "🦊 Foxy": 15,
        "🐻 Freddy": 20,
        "🪢 Springtrap": 30,
        "🌑 Nightmare": 40,
        "🎪 Circus Baby": 50,
        "👑 Glitchtrap": 70
    }

    if (!precios[rango]) {
        return await sock.sendMessage(from, { text: "❌ Ese rango no existe en la tienda." })
    }

    if (user.inventory.includes(rango)) {
        return await sock.sendMessage(from, { text: `⚠️ Ya tienes el rango *${rango}* en tu inventario.` })
    }

    if (user.fazcoins < precios[rango]) {
        return await sock.sendMessage(from, { text: `💰 No tienes suficientes Fazcoins para comprar *${rango}*.\nNecesitas *${precios[rango]}*, pero solo tienes *${user.fazcoins}*.` })
    }

    // Requisito: solo puedes comprar si tu nivel es suficiente
    if (user.level < requiredLevel[rango]) {
        return await sock.sendMessage(from, { 
            text: `❌ No puedes comprar el rango *${rango}*.\n🔒 Necesitas ser al menos nivel *${requiredLevel[rango]}*, pero eres nivel *${user.level}*.` 
        })
    }

    // Descontar fazcoins y añadir al inventario
    user.fazcoins -= precios[rango]
    user.inventory.push(rango)
    saveEconomy()

    await sock.sendMessage(from, { text: `✅ Compraste el rango *${rango}* y se añadió a tu inventario.` })
}






        // 🎮 HELADERÍA
        if (text.toLowerCase().startsWith("!helado")) {
            if (heladoGames[from]) {
                await sock.sendMessage(from, { text: "⚠️ Ya hay un helado en preparación en este chat." })
                return
            }
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            if (!mentionedJid) {
                await sock.sendMessage(from, { text: "🍦 Etiqueta a un amigo.\n👉 Ejemplo: *!helado @usuario*" })
                return
            }
            heladoGames[from] = { paso: 1, amigo: mentionedJid, player: sender }
            await sock.sendMessage(from, { 
                text: `🍦 Estás preparando un helado para *@${mentionedJid.split("@")[0]}*.\n\nElige un sabor:\n👉 !sabor vanilla\n👉 !sabor chocolate\n👉 !sabor fresa`, 
                mentions: [mentionedJid] 
            })
        }

        if (text.toLowerCase().startsWith("!sabor")) {
            const game = heladoGames[from]
            if (!game || game.paso !== 1) return
            const sabor = text.split(" ")[1]?.toLowerCase()
            if (!["vanilla", "chocolate", "fresa"].includes(sabor)) {
                return await sock.sendMessage(from, { text: "❌ Usa: vanilla, chocolate o fresa." })
            }
            game.sabor = sabor
            game.paso = 2
            await sock.sendMessage(from, { text: `😋 Elegiste *${sabor}*.\nAhora topping:\n👉 !topping chispas\n👉 !topping fruta\n👉 !topping galleta` })
        }

        if (text.toLowerCase().startsWith("!topping")) {
            const game = heladoGames[from]
            if (!game || game.paso !== 2) return
            const topping = text.split(" ")[1]?.toLowerCase()
            if (!["chispas", "fruta", "galleta"].includes(topping)) {
                return await sock.sendMessage(from, { text: "❌ Usa: chispas, fruta o galleta." })
            }
            game.topping = topping
            game.paso = 3
            await sock.sendMessage(from, { text: `🍫 Agregaste *${topping}*.\nAhora presentación:\n👉 !presentacion cono\n👉 !presentacion vaso` })
        }

        if (text.toLowerCase().startsWith("!presentacion")) {
            const game = heladoGames[from]
            if (!game || game.paso !== 3) return
            const recipiente = text.split(" ")[1]?.toLowerCase()
            if (!["cono", "vaso"].includes(recipiente)) {
                return await sock.sendMessage(from, { text: "❌ Usa: cono o vaso." })
            }
            game.recipiente = recipiente

            ensureUser(sender)
            economy[sender].fazcoins += 5
            saveEconomy()

            // 🎉 Helado terminado
            const heladoFinal = `./media/helados/${game.sabor}con${game.topping}${game.recipiente}.jpg`
            await sock.sendMessage(from, { 
                image: { url: heladoFinal }, 
                caption: `🍨 @${game.amigo.split("@")[0]}, aquí tienes tu helado hecho por @${sender.split("@")[0]}.\n\n❤️ Reacciona si te gustó\n👎 O con pulgar abajo si no te gustó.`,
                mentions: [game.amigo, sender]
            })

            // Guardamos estado
            heladoGames[from].esperandoReaccion = true
        }

    // 🎮 ENTREVISTA SCRAPBABY
if (text.toLowerCase() === "!scrapbaby") {
    const user = economy[sender]
    const rank = getRank(user.level)

    // 🚫 Solo rango 🐻 Freddy puede jugar
  if (!hasAccessToGame(user, "🦊 Foxy")) {
    return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🦊 Bonnie." })
}

    if (entrevistasActivas[sender]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes una entrevista activa. Termínala antes de empezar otra." })
    }

    const fases = [
        "./media/entrevista/scrapbaby/papel.jpg", // 0 inicio
        "./media/entrevista/scrapbaby/1.jpg",    
        "./media/entrevista/scrapbaby/2.jpg",    
        "./media/entrevista/scrapbaby/3.jpg",    
        "./media/entrevista/scrapbaby/4.jpg",    
        "./media/entrevista/scrapbaby/5.jpg"     // 💀 jumpscare
    ]
    entrevistasActivas[sender] = { animatronico: "Scrapbaby", fase: 0, fases }
    await sock.sendMessage(from, { image: { url: fases[0] }, caption: "🎙️ Entrevista con *Scrapbaby* iniciada.\nEscribe *!grabar* para continuar." })
}

// 🎮 ENTREVISTA LEFTY
if (text.toLowerCase() === "!lefty") {
    const user = economy[sender]
    const rank = getRank(user.level)

    // 🚫 Solo rango 🐻 Freddy puede jugar
   if (!hasAccessToGame(user, "🐻 Freddy")) {
    return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐻 Freddy." })
}

    if (entrevistasActivas[sender]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes una entrevista activa. Termínala antes de empezar otra." })
    }

    const fases = [
        "./media/entrevista/lefty/papel.jpg", 
        "./media/entrevista/lefty/1.jpg",    
        "./media/entrevista/lefty/2.jpg",    
        "./media/entrevista/lefty/3.jpg",    
        "./media/entrevista/lefty/4.jpg"     // 💀 jumpscare
    ]
    entrevistasActivas[sender] = { animatronico: "Lefty", fase: 0, fases }
    await sock.sendMessage(from, { image: { url: fases[0] }, caption: "🎙️ Entrevista con *Lefty* iniciada.\nEscribe *!grabar* para continuar." })
}


      // 🎙️ CONTINUAR ENTREVISTAS
if (text.toLowerCase() === "!grabar") {
    const game = entrevistasActivas[sender]
    if (!game) return

    game.fase++

    // 💀 Jumpscare (Scrapbaby fase 5, Lefty fase 4)
    if ((game.animatronico === "Scrapbaby" && game.fase === 5) ||
        (game.animatronico === "Lefty" && game.fase === 4)) {
        await sock.sendMessage(from, { 
            image: { url: game.fases[game.fase] }, 
            caption: `💀 ${game.animatronico} te hizo un jumpscare...` 
        })
        delete entrevistasActivas[sender]
        return
    }

    // ✅ Victoria antes del jumpscare
    if (game.fase === game.fases.length - 1) {
        ensureUser(sender)

        // 📌 Recompensas
        economy[sender].fazcoins += 10
        await addXP(sender, 20, sock, from) // 👈 ejemplo: +20 XP

        saveEconomy()
        await sock.sendMessage(from, { 
            text: `✅ Entrevista con *${game.animatronico}* completada.\n\n🏆 Ganaste:\n+10 Fazcoins 💰\n+20 XP ⭐` 
        })
        delete entrevistasActivas[sender]
        return
    }

    await sock.sendMessage(from, { 
        image: { url: game.fases[game.fase] }, 
        caption: `🎙️ Entrevista con ${game.animatronico}...\nEscribe *!grabar* para continuar.` 
    })
}



        // 👉 Función auxiliar YouTube
        async function getYoutubeUrl(query) {
            if (ytdl.validateURL(query)) return query
            const search = await ytSearch(query)
            if (!search.videos.length) return null
            return search.videos[0].url
        }

        // 📌 Comando !menu
        if (text.toLowerCase() === "!menu") {
            const menuMessage = `
📌 *Menú del Bot*

*Usa !registrar antes de usar el bot*
--------------------------
🎵 *Descargar Audio de YouTube*
   👉 !ytaudio <nombre o link>

🎥 *Descargar Video de YouTube*
   👉 !ytvideo <nombre o link>

🎮 *Juegos*

 *Rango: 🎈 Ballon Boy*
  👋 *Individual*
   👉 !tictactoeia
   👉 !robobateria
   👉 !escondite
   👉 !eco

🤝*Cooperativos*
   👉 !risascoop
   👉 !globoscoop
   👉 !linternacoop

 *Rango: 🐤 Chica*
  👋 *Individual*
   👉 !ttt
   👉 !cupcakerun
   👉 !luzjuego

 🤝*Cooperativos*    
   👉 !pizzarace
   👉 !cocinaloca
   👉 !noche

 *Rango: 🐰 Bonnie*
  👋 *Individual*
   👉 !plushtrap
   👉 !musica - !repetir
   👉 !guitarra
   👉 !linterna

 🤝*Cooperativos*
   👉 !duo
   👉 !banda
   👉 !afinar

 *Rango: 🦊 Foxy*
  👋 *Individual*
   👉 !scrapbaby
   👉 !carrerafoxy
   👉 !tesorofoxy
   👉 !emboscadafoxy

 🤝*Cooperativos*
   👉 !barcofoxy - !remar
   👉 !cazafoxy - !excavar
   👉 !batallafoxy - !disparar

 *Rango: 🐻 Freddy*
  👋 *Individual*
   👉 !lefty
   👉 !sombras
   👉 !campanas

 🤝*Cooperativos*
   👉 !coro
   👉 !puertas-!forzar
   👉 !ritual
🎮 *TicTacToe 2 Jugadores*
   👉 !ttt (Jugador 1 inicia, Jugador 2 usa !join)


🍧 *Prepara un Helado*
    👉!helado → Prepara un helado para un amigo 🍦

💰 *Economía Fazcoins*
   👉 !perfil
   👉 !top
   👉 !reseteco (solo admin)

👋 *Saludo*
   👉 hola
--------------------------
Escribe un comando para empezar 🚀
            `
            await sock.sendMessage(from, { text: menuMessage })
        }

        // 💰 RESETEAR ECONOMÍA (solo admin)
        if (text.toLowerCase() === "!reseteco") {
            if (sender !== ADMIN_JID) {
                return await sock.sendMessage(from, { text: "❌ No tienes permiso para usar este comando." })
            }
            economy = {}
            saveEconomy()
            await sock.sendMessage(from, { text: "♻️ Economía reseteada correctamente." })
        }

        // 🎮 Iniciar Plushtrap
if (text.toLowerCase() === "!plushtrap") {
    const user = economy[sender]
    const rank = getRank(user.level)

    // 🚫 Solo rango 🐰 Bonnie puede jugar
    if (rank !== "🐰 Bonnie") {
        return await sock.sendMessage(from, { 
            text: `🚫 Tu rango actual (*${rank}*) no te permite jugar a Plushtrap.\n\nEste minijuego es exclusivo del rango *🐰 Bonnie*.` 
        })
    }

    if (plushtrapGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes un minijuego activo de Plushtrap aquí." })
    }

    plushtrapGames[from] = {
        pos: 2, // empieza en la silla
        player: sender
    }

    await sock.sendMessage(from, { 
        image: { url: "./media/plushtrap/2_silla.jpg" }, 
        caption: `👻 *Plushtrap Challenge* 👻\nEl juego comienza...\nEspera y luego usa *!flash* para encender la linterna.` 
    })

    plushtrapGames[from].interval = setInterval(async () => {
        const game = plushtrapGames[from]
        if (!game) return

        let newPos
        do {
            newPos = Math.floor(Math.random() * 5) + 2
        } while (newPos === game.pos)

        game.pos = newPos

        const imgMap = {
            2: "./media/plushtrap/2_silla.jpg",
            3: "./media/plushtrap/3_parado.jpg",
            4: "./media/plushtrap/4_puerta2.jpg",
            5: "./media/plushtrap/5_puerta4.jpg",
            6: "./media/plushtrap/6_cercaX.jpg"
        }

        await sock.sendMessage(from, { 
            image: { url: imgMap[game.pos] }, 
            caption: "🔦 Usa *!flash* para intentar atraparlo." 
        })
    }, 7000) // cada 7 segundos se mueve
}

// 🎮 Flash en Plushtrap
if (text.toLowerCase() === "!flash") {
    const game = plushtrapGames[from]
    if (!game) {
        return await sock.sendMessage(from, { text: "❌ No tienes un minijuego activo. Usa *!plushtrap* para empezar." })
    }

    clearInterval(game.interval)

    if (game.pos === 6) {
        ensureUser(sender)
        economy[sender].fazcoins += 10
        saveEconomy()

        // 🎁 Ganar XP al atrapar a Plushtrap
        await addXP(sender, 15, sock, from)

        await sock.sendMessage(from, { 
            image: { url: "./media/plushtrap/7_win.jpg" }, 
            caption: `🎉 ¡Lo atrapaste en la X! Ganaste *10 Fazcoins* 💰 y *15 XP* ⭐` 
        })
    } else {
        await sock.sendMessage(from, { 
            image: { url: "./media/plushtrap/1_jumpscare.jpg" }, 
            caption: "💀 Jumpscare... Plushtrap te atrapó. Perdiste." 
        })
    }

    delete plushtrapGames[from]
}


// 🎮 Iniciar TicTacToe vs IA
if (text.toLowerCase() === "!tictactoeia") {
    ensureUser(sender)
    const user = economy[sender]
    const rank = getRank(user.level)

    // ✅ Solo puede jugar si está en rango "Balloon Boy"
   if (!hasAccessToGame(user, "🎈 Balloon Boy")) { 
    return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🎈 Balloon Boy." })
}


    tictactoeGames[from] = {
        mode: "ia",
        board: [...numEmojis],
        turn: "❌",
        player: sender
    }
    await sock.sendMessage(from, { 
        text: `🎮 *TicTacToe vs IA* 🎮\nEmpiezas con ❌\n\n${renderBoard(tictactoeGames[from].board)}\n\nJuega con: !play <número>` 
    })
}

   // 🎮 Iniciar TicTacToe PvP
if (text.toLowerCase() === "!ttt") {
    ensureUser(sender)
    const user = economy[sender]
    const rank = getRank(user.level)

    // ✅ Solo puede jugar si está en rango "Chica"
  if (!hasAccessToGame(user, "🐤 Chica")) {
    return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐤 Chica." })
}

    if (tictactoeGames[from]) {
        return await sock.sendMessage(from, { 
            text: "⚠️ Ya hay una partida en curso en este chat. Termina primero." 
        })
    }
    tictactoeGames[from] = {
        mode: "pvp",
        board: [...numEmojis],
        turn: "❌",
        players: [sender, null]
    }
    const name = getName(sender, msg)
    await sock.sendMessage(from, { 
        text: `🎮 *TicTacToe (2 Jugadores)* 🎮\nJugador 1 (${name}) es ❌\nEsperando que otro jugador use *!join* para ser ⭕.` 
    })
}

        // 🎮 Unirse a TicTacToe PvP
        if (text.toLowerCase() === "!join") {
            const game = tictactoeGames[from]
            if (!game || game.mode !== "pvp") {
                return await sock.sendMessage(from, { text: "❌ No hay partida esperando jugadores. Usa *!ttt* para iniciar una." })
            }
            if (game.players[1]) {
                return await sock.sendMessage(from, { text: "⚠️ Ya hay dos jugadores en esta partida." })
            }
            game.players[1] = sender
            const name = getName(sender, msg)
            const name1 = getName(game.players[0], msg)
            await sock.sendMessage(from, { text: `✅ ${name} se unió como ⭕\n\nEmpieza ${name1} (❌)\n\n${renderBoard(game.board)}\n\nJuega con: !play <número>` })
        }

        // 🎮 Jugar turno (IA o PvP)
        if (text.toLowerCase().startsWith("!play")) {
            if (!tictactoeGames[from]) {
                return await sock.sendMessage(from, { text: "❌ No tienes partida activa. Usa *!tictactoeia* o *!ttt* para empezar." })
            }

            const game = tictactoeGames[from]
            const move = parseInt(text.split(" ")[1]) - 1

            if (isNaN(move) || move < 0 || move > 8 || game.board[move] === "❌" || game.board[move] === "⭕") {
                return await sock.sendMessage(from, { text: "❌ Movimiento inválido. Elige un número disponible." })
            }

            // 📌 Juego contra IA
            if (game.mode === "ia") {
                if (game.turn !== "❌") return
                game.board[move] = "❌"

               if (checkWinner(game.board, "❌")) {
    ensureUser(sender)
    economy[sender].fazcoins += 5
    await addXP(sender, 20, sock, from)  // 👈 agrega 20 XP
    saveEconomy()
    const name = getName(sender, msg)
    await sock.sendMessage(from, { 
        text: `🎉 ${name} ganó y obtuvo *5 Fazcoins* y *20 XP*!\n\n${renderBoard(game.board)}` 
    })
    delete tictactoeGames[from]
    return
}

                let emptyCells = game.board.map((v,i) => v !== "❌" && v !== "⭕" ? i : null).filter(v => v !== null)
                if (emptyCells.length === 0) {
                    await sock.sendMessage(from, { text: `🤝 Empate!\n\n${renderBoard(game.board)}` })
                    delete tictactoeGames[from]
                    return
                }
                const aiMove = emptyCells[Math.floor(Math.random() * emptyCells.length)]
                game.board[aiMove] = "⭕"

                if (checkWinner(game.board, "⭕")) {
                    const name = getName(sender, msg)
                    await sock.sendMessage(from, { text: `💀 ${name}, perdiste!\n\n${renderBoard(game.board)}` })
                    delete tictactoeGames[from]
                    return
                }

                await sock.sendMessage(from, { text: `Tu turno ❌\n\n${renderBoard(game.board)}\n\nJuega con: !play <número>` })
            }

            // 📌 Juego PvP
            else if (game.mode === "pvp") {
                const currentPlayer = game.turn === "❌" ? game.players[0] : game.players[1]
                if (sender !== currentPlayer) {
                    return await sock.sendMessage(from, { text: "⚠️ No es tu turno." })
                }

                game.board[move] = game.turn

              if (checkWinner(game.board, game.turn)) {
    ensureUser(sender)
    economy[sender].fazcoins += 10
    await addXP(sender, 30, sock, from)  // 👈 agrega 30 XP
    saveEconomy()
    const name = getName(sender, msg)
    await sock.sendMessage(from, { 
        text: `🎉 ${name} (${game.turn}) ganó y obtuvo *10 Fazcoins* y *30 XP*!\n\n${renderBoard(game.board)}` 
    })
    delete tictactoeGames[from]
    return
}

                let emptyCells = game.board.map((v,i) => v !== "❌" && v !== "⭕" ? i : null).filter(v => v !== null)
                if (emptyCells.length === 0) {
                    await sock.sendMessage(from, { text: `🤝 Empate!\n\n${renderBoard(game.board)}` })
                    delete tictactoeGames[from]
                    return
                }

                game.turn = game.turn === "❌" ? "⭕" : "❌"
                const nextPlayer = game.turn === "❌" ? game.players[0] : game.players[1]
                const nextName = getName(nextPlayer, msg)
                await sock.sendMessage(from, { text: `👉 Turno de ${nextName} (${game.turn})\n\n${renderBoard(game.board)}\n\nJuega con: !play <número>` })
            }
        }

// 🎮 Cupcake Run (Chica - individual)
if (text.toLowerCase() === "!cupcakerun") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🐤 Chica")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐤 Chica." })
    }

    if (cupcakeRunGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes un Cupcake Run activo aquí." })
    }

    cupcakeRunGames[from] = { caught: 0, missed: 0, player: sender }

    await sock.sendMessage(from, { text: "🧁 *Cupcake Run* iniciado. Escribe `!atrapar` cuando aparezca un cupcake." })

    cupcakeRunGames[from].interval = setInterval(async () => {
        const game = cupcakeRunGames[from]
        if (!game) return

        const appear = Math.random() < 0.7 // 70% aparece un cupcake
        if (appear) {
            game.waiting = true
            await sock.sendMessage(from, { text: "🧁 ¡Cupcake apareció! Escribe `!atrapar` rápido." })
            setTimeout(() => { if (game.waiting) game.missed++ }, 4000)
        }

        if (game.missed >= 3) {
            await sock.sendMessage(from, { text: "❌ Perdiste el *Cupcake Run*. Fallaste demasiados cupcakes." })
            clearInterval(game.interval)
            delete cupcakeRunGames[from]
        }
    }, 6000)
}

if (text.toLowerCase() === "!atrapar") {
    const game = cupcakeRunGames[from]
    if (!game) return

    if (game.waiting) {
        game.caught++
        game.waiting = false
        await sock.sendMessage(from, { text: `✅ Atrapaste un cupcake. Total atrapados: ${game.caught}` })
        if (game.caught >= 5) {
            ensureUser(sender)
            economy[sender].fazcoins += 12
            await addXP(sender, 18, sock, from)
            saveEconomy()
            await sock.sendMessage(from, { text: "🎉 ¡Ganaste el Cupcake Run! Obtienes *12 Fazcoins* 💰 y *18 XP* ⭐" })
            clearInterval(game.interval)
            delete cupcakeRunGames[from]
        }
    } else {
        await sock.sendMessage(from, { text: "❌ No hay cupcake que atrapar ahora." })
    }
}



// 🎮 Apaga y Prende la Luz (Chica - individual)
if (text.toLowerCase() === "!luzjuego") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🐤 Chica")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐤 Chica." })
    }

    if (luzGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes un Apaga y Prende la Luz activo aquí." })
    }

    luzGames[from] = { fase: 0, player: sender }

    await sock.sendMessage(from, { text: "🔦 *Juego de la Luz* iniciado. Usa `!luz` para espantar a Chica cuando se acerque." })

    luzGames[from].interval = setInterval(async () => {
        const game = luzGames[from]
        if (!game) return

        game.fase++
        if (game.fase >= 3) {
            await sock.sendMessage(from, { text: "💀 Chica llegó hasta ti. Perdiste." })
            clearInterval(game.interval)
            delete luzGames[from]
            return
        }

        game.waiting = true
        await sock.sendMessage(from, { text: "⚠️ ¡Chica se acerca! Usa `!luz` ahora." })

        setTimeout(() => {
            if (game && game.waiting) {
                sock.sendMessage(from, { text: "💀 No usaste la luz a tiempo. Perdiste." })
                clearInterval(game.interval)
                delete luzGames[from]
            }
        }, 4000)
    }, 7000)
}

if (text.toLowerCase() === "!luz") {
    const game = luzGames[from]
    if (!game) return

    if (game.waiting) {
        game.waiting = false
        await sock.sendMessage(from, { text: "✅ Chica retrocedió gracias a la luz." })
        if (game.fase >= 2) {
            ensureUser(sender)
            economy[sender].fazcoins += 15
            await addXP(sender, 20, sock, from)
            saveEconomy()
            await sock.sendMessage(from, { text: "🎉 ¡Sobreviviste el Juego de la Luz! Ganaste *15 Fazcoins* 💰 y *20 XP* ⭐" })
            clearInterval(game.interval)
            delete luzGames[from]
        }
    } else {
        await sock.sendMessage(from, { text: "❌ Ahora no es momento de usar la luz." })
    }
}

// 🎮 Pizza Race (Chica - cooperativo)
if (text.toLowerCase().startsWith("!pizzarace ")) {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🐤 Chica")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐤 Chica." })
    }

    const args = text.split(" ")
    const opponent = args[1]?.replace(/[@+]/g, "") + "@s.whatsapp.net"

    if (!opponent || opponent === sender) {
        return await sock.sendMessage(from, { text: "⚠️ Debes mencionar a otro jugador para iniciar." })
    }

    if (pizzaRaceGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay una Pizza Race activa en este chat." })
    }

    pizzaRaceGames[from] = {
        players: [sender, opponent],
        progress: { [sender]: 0, [opponent]: 0 }
    }

    await sock.sendMessage(from, { text: `🍕 *Pizza Race* iniciada entre @${sender.split("@")[0]} y @${opponent.split("@")[0]}!\nUsen *!hornear* para avanzar.\nEl primero en hornear 5 veces gana.` , mentions: [sender, opponent] })
}

if (text.toLowerCase() === "!hornear") {
    const game = pizzaRaceGames[from]
    if (!game) return

    if (!game.players.includes(sender)) return

    game.progress[sender]++
    if (game.progress[sender] >= 5) {
        ensureUser(sender)
        economy[sender].fazcoins += 20
        await addXP(sender, 25, sock, from)
        saveEconomy()
        await sock.sendMessage(from, { text: `🎉 @${sender.split("@")[0]} ganó la *Pizza Race*! 🏆\n+20 Fazcoins 💰 +25 XP ⭐`, mentions: [sender] })
        delete pizzaRaceGames[from]
    } else {
        await sock.sendMessage(from, { text: `🔥 @${sender.split("@")[0]} horneó una pizza. Total: ${game.progress[sender]}/5.`, mentions: [sender] })
    }
}

// 🎮 Cocina Loca (Chica - cooperativo)
if (text.toLowerCase().startsWith("!cocinaloca ")) {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🐤 Chica")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐤 Chica." })
    }

    const args = text.split(" ")
    const partner = args[1]?.replace(/[@+]/g, "") + "@s.whatsapp.net"

    if (!partner || partner === sender) {
        return await sock.sendMessage(from, { text: "⚠️ Debes mencionar a un compañero para cocinar juntos." })
    }

    if (cocinaLocaGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay una Cocina Loca activa en este chat." })
    }

    cocinaLocaGames[from] = {
        players: [sender, partner],
        steps: 0
    }

    await sock.sendMessage(from, { text: `👩‍🍳 *Cocina Loca* iniciada entre @${sender.split("@")[0]} y @${partner.split("@")[0]}!\nUsen *!cocinar* juntos 6 veces para completar el platillo.` , mentions: [sender, partner] })
}

if (text.toLowerCase() === "!cocinar") {
    const game = cocinaLocaGames[from]
    if (!game) return

    if (!game.players.includes(sender)) return

    game.steps++
    if (game.steps >= 6) {
        for (let player of game.players) {
            ensureUser(player)
            economy[player].fazcoins += 15
            await addXP(player, 20, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: `🎉 ¡@${game.players[0].split("@")[0]} y @${game.players[1].split("@")[0]} completaron la *Cocina Loca*! 🍲\n+15 Fazcoins 💰 +20 XP ⭐ cada uno.`, mentions: game.players })
        delete cocinaLocaGames[from]
    } else {
        await sock.sendMessage(from, { text: `🥘 Paso ${game.steps}/6 completado en la cocina.` })
    }
}

// 🎮 Sobrevive la Noche (Chica - cooperativo)
if (text.toLowerCase().startsWith("!noche ")) {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🐤 Chica")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐤 Chica." })
    }

    const args = text.split(" ")
    const friend = args[1]?.replace(/[@+]/g, "") + "@s.whatsapp.net"

    if (!friend || friend === sender) {
        return await sock.sendMessage(from, { text: "⚠️ Debes mencionar a un amigo para sobrevivir la noche." })
    }

    if (sobrevivirNocheGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay un juego de Sobrevive la Noche activo aquí." })
    }

    sobrevivirNocheGames[from] = {
        players: [sender, friend],
        rounds: 0
    }

    await sock.sendMessage(from, { text: `🌙 *Sobrevive la Noche* iniciado entre @${sender.split("@")[0]} y @${friend.split("@")[0]}!\nUsen *!vigilar* para pasar las horas.\nSobrevivan 5 rondas.` , mentions: [sender, friend] })
}

if (text.toLowerCase() === "!vigilar") {
    const game = sobrevivirNocheGames[from]
    if (!game) return

    if (!game.players.includes(sender)) return

    game.rounds++
    if (game.rounds >= 5) {
        for (let player of game.players) {
            ensureUser(player)
            economy[player].fazcoins += 25
            await addXP(player, 30, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: `🎉 ¡Sobrevivieron la noche! 🌙\n@${game.players[0].split("@")[0]} y @${game.players[1].split("@")[0]} ganaron *25 Fazcoins* 💰 y *30 XP* ⭐ cada uno.`, mentions: game.players })
        delete sobrevivirNocheGames[from]
    } else {
        await sock.sendMessage(from, { text: `🕒 Han pasado ${game.rounds}/5 horas de la noche...` })
    }
}

// 🎮 Juego individual del rango 🐰 Bonnie - Secuencia Musical
if (text.toLowerCase() === "!musica") {
       ensureUser(sender)
    const user = economy[sender]

      if (!hasAccessToGame(user, "🐰 Bonnie")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐰 Bonnie." })
    }

    if (!bonnieMusicGames[from]) {
        const sequence = ["🎵", "🥁", "🎸"]
        bonnieMusicGames[from] = { sequence, step: 0 }

        await sock.sendMessage(from, { text: `🎶 *Secuencia Musical*\nRepite esta secuencia: ${sequence.join(" ")}` })
    }
}

if (text.startsWith("!repetir ")) {
    const game = bonnieMusicGames[from]
    if (!game) return

    const answer = text.replace("!repetir ", "").trim().split(" ")
    if (JSON.stringify(answer) === JSON.stringify(game.sequence)) {
        economy[sender].fazcoins += 10
        await addXP(sender, 15, sock, from)
        saveEconomy()

        await sock.sendMessage(from, { text: "✅ ¡Correcto! Tocaste la melodía y ganaste *10 Fazcoins* 💰 y *15 XP* ⭐" })
    } else {
        await sock.sendMessage(from, { text: "❌ La secuencia está mal. Intenta de nuevo." })
    }
    delete bonnieMusicGames[from]
}

// 🎮 Juego individual del rango 🐰 Bonnie - Guitarra Desafinada
if (text.toLowerCase() === "!guitarra") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🐰 Bonnie")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐰 Bonnie." })
    }

    if (!bonnieGuitarGames[from]) {
        const correctString = Math.floor(Math.random() * 6) + 1
        bonnieGuitarGames[from] = { correct: correctString }

        await sock.sendMessage(from, { text: "🎸 *Guitarra Desafinada*\nElige qué cuerda ajustar con `!ajustar [1-6]`" })
    }
}

if (text.startsWith("!ajustar ")) {
    const game = bonnieGuitarGames[from]
    if (!game) return

    const choice = parseInt(text.split(" ")[1])
    if (choice === game.correct) {
        economy[sender].fazcoins += 12
        await addXP(sender, 20, sock, from)
        saveEconomy()

        await sock.sendMessage(from, { text: "✅ ¡Correcto! Ajustaste la cuerda adecuada.\nGanaste *12 Fazcoins* 💰 y *20 XP* ⭐" })
    } else {
        await sock.sendMessage(from, { text: "❌ Esa cuerda no era la correcta. La guitarra sigue desafinada." })
    }
    delete bonnieGuitarGames[from]
}

// 🎮 Juego individual del rango 🐰 Bonnie - Juego de la Linterna
if (text.toLowerCase() === "!linterna") {
    ensureUser(sender)
    const user = economy[sender]
    if (!hasAccessToGame(user, "🐰 Bonnie")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐰 Bonnie." })
    }

    if (!bonnieFlashlightGames[from]) {
        const objects = ["🔑 Llave", "🎸 Guitarra", "👻 Sombra"]
        const hidden = objects[Math.floor(Math.random() * objects.length)]
        bonnieFlashlightGames[from] = { hidden }

        await sock.sendMessage(from, { text: "🔦 *Juego de la Linterna*\nUsa `!buscar [objeto]` para intentar encontrar lo que está escondido.\nOpciones: Llave, Guitarra, Sombra." })
    }
}

if (text.startsWith("!buscar ")) {
    const game = bonnieFlashlightGames[from]
    if (!game) return

    const guess = text.replace("!buscar ", "").trim()
    if (game.hidden.includes(guess)) {
        economy[sender].fazcoins += 15
        await addXP(sender, 25, sock, from)
        saveEconomy()

        await sock.sendMessage(from, { text: `✅ ¡Encontraste ${game.hidden}! Ganaste *15 Fazcoins* 💰 y *25 XP* ⭐` })
    } else {
        await sock.sendMessage(from, { text: "❌ No encontraste nada, sigue buscando..." })
    }
    delete bonnieFlashlightGames[from]
}

// 🤝 Juego cooperativo del rango 🐰 Bonnie - Dúo Musical
if (text.toLowerCase() === "!duo") {
    ensureUser(sender)
    const user = economy[sender]
    if (!hasAccessToGame(user, "🐰 Bonnie")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐰 Bonnie." })
    }

    if (bonnieDuoGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay un dúo en progreso. Usa `!unirme` para participar." })
    }

    bonnieDuoGames[from] = { players: [sender] }

    await sock.sendMessage(from, { text: "🎶 *Dúo Musical* 🎶\nUn jugador comenzó el dúo.\nOtro jugador puede unirse con `!unirme`." })
}

if (text.toLowerCase() === "!unirme") {
    const game = bonnieDuoGames[from]
    if (!game) return

    if (game.players.length >= 2) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay suficientes jugadores para este dúo." })
    }

    if (game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "⚠️ Ya estás en este dúo." })
    }

    game.players.push(sender)

    // Ambos ganan recompensa
    for (const player of game.players) {
        ensureUser(player)
        economy[player].fazcoins += 20
        await addXP(player, 30, sock, from)
    }
    saveEconomy()

    await sock.sendMessage(from, { text: "✅ ¡El dúo musical fue un éxito! Ambos ganaron *20 Fazcoins* 💰 y *30 XP* ⭐" })
    delete bonnieDuoGames[from]
}

// 🤝 Juego cooperativo del rango 🐰 Bonnie - Banda Completa
if (text.toLowerCase() === "!banda") {
    ensureUser(sender)
    const user = economy[sender]
    if (!hasAccessToGame(user, "🐰 Bonnie")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐰 Bonnie." })
    }

    if (!bonnieBandGames[from]) {
        bonnieBandGames[from] = { players: [], needed: 3 }
        await sock.sendMessage(from, { text: "🥁 *Banda Completa* 🎸\nSe necesitan 3 músicos.\nUsa `!tocar` para unirte." })
    }
}

if (text.toLowerCase() === "!tocar") {
    const game = bonnieBandGames[from]
    if (!game) return

    if (game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "⚠️ Ya estás en esta banda." })
    }

    game.players.push(sender)

    if (game.players.length >= game.needed) {
        // Recompensar a todos
        for (const player of game.players) {
            ensureUser(player)
            economy[player].fazcoins += 25
            await addXP(player, 35, sock, from)
        }
        saveEconomy()

        await sock.sendMessage(from, { text: "🎶 ¡La banda tocó increíble! Cada músico ganó *25 Fazcoins* 💰 y *35 XP* ⭐" })
        delete bonnieBandGames[from]
    } else {
        await sock.sendMessage(from, { text: `🎸 ${game.players.length}/3 músicos en la banda. Faltan ${game.needed - game.players.length}.` })
    }
}

// 🤝 Juego cooperativo del rango 🐰 Bonnie - Afinar en Equipo
if (text.toLowerCase() === "!afinar") {
    ensureUser(sender)
    const user = economy[sender]
    if (!hasAccessToGame(user, "🐰 Bonnie")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐰 Bonnie." })
    }

    if (!bonnieTuneGames[from]) {
        bonnieTuneGames[from] = { players: [], needed: 2 }
        await sock.sendMessage(from, { text: "🎸 *Afinar en Equipo*\nSe necesitan 2 jugadores.\nUsa `!ajustar` para unirte." })
    }
}

if (text.toLowerCase() === "!ajustar") {
    const game = bonnieTuneGames[from]
    if (!game) return

    if (game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "⚠️ Ya estás en este equipo de afinación." })
    }

    game.players.push(sender)

    if (game.players.length >= game.needed) {
        // Recompensar a todos
        for (const player of game.players) {
            ensureUser(player)
            economy[player].fazcoins += 18
            await addXP(player, 28, sock, from)
        }
        saveEconomy()

        await sock.sendMessage(from, { text: "✅ ¡La guitarra quedó perfectamente afinada! Ambos ganaron *18 Fazcoins* 💰 y *28 XP* ⭐" })
        delete bonnieTuneGames[from]
    } else {
        await sock.sendMessage(from, { text: `🎶 ${game.players.length}/2 jugadores listos para afinar.` })
    }
}


//Juego de Carrera Foxy para el rango Foxy (individual)
if (text.toLowerCase() === "!carrerafoxy") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🦊 Foxy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🦊 Foxy." })
    }

    if (carreraFoxyGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes una Carrera Pirata activa." })
    }

    carreraFoxyGames[from] = { fase: 0, player: sender }
    await sock.sendMessage(from, { text: "🏃‍♂️ *Carrera Pirata iniciada*.\nPrepárate para reaccionar con los comandos: *!saltar*, *!agacharse*, *!girar*." })

    // iniciar primer reto
    carreraFoxyGames[from].fase = 1
    await sock.sendMessage(from, { text: "⚠️ ¡Obstáculo! Escribe *!saltar* rápido." })

    // tiempo límite
    setTimeout(async () => {
        const game = carreraFoxyGames[from]
        if (game && game.fase === 1) {
            await sock.sendMessage(from, { video: { url: "./media/foxy/jumpscare.gif" }, gifPlayback: true, caption: "💀 ¡Fallaste en la carrera, Foxy te atrapó!" })
            delete carreraFoxyGames[from]
        }
    }, 7000)
}

if (["!saltar", "!agacharse", "!girar"].includes(text.toLowerCase())) {
    const game = carreraFoxyGames[from]
    if (!game) return

    // lógica simple de fases
    if (game.fase === 1 && text.toLowerCase() === "!saltar") {
        game.fase = 2
        await sock.sendMessage(from, { text: "✅ Saltaste con éxito.\n⚠️ Nuevo obstáculo: escribe *!agacharse*." })

        setTimeout(async () => {
            if (game && game.fase === 2) {
                await sock.sendMessage(from, { video: { url: "./media/foxy/jumpscare.gif" }, gifPlayback: true, caption: "💀 ¡Fallaste en la carrera, Foxy te atrapó!" })
                delete carreraFoxyGames[from]
            }
        }, 7000)
    }
    else if (game.fase === 2 && text.toLowerCase() === "!agacharse") {
        game.fase = 3
        await sock.sendMessage(from, { text: "✅ Te agachaste.\n⚠️ Último obstáculo: escribe *!girar*." })

        setTimeout(async () => {
            if (game && game.fase === 3) {
                await sock.sendMessage(from, { video: { url: "./media/foxy/jumpscare.gif" }, gifPlayback: true, caption: "💀 ¡Fallaste en la carrera, Foxy te atrapó!" })
                delete carreraFoxyGames[from]
            }
        }, 7000)
    }
    else if (game.fase === 3 && text.toLowerCase() === "!girar") {
        ensureUser(sender)
        economy[sender].fazcoins += 20
        await addXP(sender, 25, sock, from)
        saveEconomy()

        await sock.sendMessage(from, { text: "🏆 ¡Terminaste la Carrera Pirata!\nGanaste *20 Fazcoins* 💰 y *25 XP* ⭐" })
        delete carreraFoxyGames[from]
    }
}


//Tesoro Foxy
if (text.toLowerCase() === "!tesorofoxy") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🦊 Foxy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🦊 Foxy." })
    }

    tesoroFoxyGames[from] = { player: sender }
    await sock.sendMessage(from, { text: "💰 *Tesoro Maldito*.\nElige un cofre: `!abrir 1`, `!abrir 2`, `!abrir 3`." })
}

if (text.toLowerCase().startsWith("!abrir")) {
    const game = tesoroFoxyGames[from]
    if (!game) return

    const eleccion = text.split(" ")[1]
    if (!["1","2","3"].includes(eleccion)) return

    const resultado = Math.random()
    if (resultado < 0.3) {
        await sock.sendMessage(from, { video: { url: "./media/foxy/jumpscare.gif" }, gifPlayback: true, caption: "💀 El cofre estaba maldito, Foxy te atrapó." })
    } else {
        const coins = 10 + Math.floor(Math.random() * 15)
        const xp = 10 + Math.floor(Math.random() * 20)
        ensureUser(sender)
        economy[sender].fazcoins += coins
        await addXP(sender, xp, sock, from)
        saveEconomy()

        await sock.sendMessage(from, { text: `🏆 ¡Encontraste tesoro!\nGanaste *${coins} Fazcoins* 💰 y *${xp} XP* ⭐` })
    }
    delete tesoroFoxyGames[from]
}


//Emboscada de foxy rango Foxy.
if (text.toLowerCase() === "!emboscadafoxy") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🦊 Foxy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🦊 Foxy." })
    }

    emboscadaFoxyGames[from] = { player: sender }
    await sock.sendMessage(from, { text: "⚔️ *Emboscada de Foxy*.\nElige: `!pelear` o `!escapar`." })
}

if (["!pelear", "!escapar"].includes(text.toLowerCase())) {
    const game = emboscadaFoxyGames[from]
    if (!game) return

    const eleccion = text.toLowerCase()
    const resultado = Math.random()

    if ((eleccion === "!pelear" && resultado < 0.5) || (eleccion === "!escapar" && resultado < 0.5)) {
        await sock.sendMessage(from, { video: { url: "./media/foxy/jumpscare.gif" }, gifPlayback: true, caption: "💀 Foxy ganó la emboscada." })
    } else {
        const coins = 15
        const xp = 20
        ensureUser(sender)
        economy[sender].fazcoins += coins
        await addXP(sender, xp, sock, from)
        saveEconomy()

        await sock.sendMessage(from, { text: `🏆 Sobreviviste a la emboscada.\nGanaste *${coins} Fazcoins* 💰 y *${xp} XP* ⭐` })
    }
    delete emboscadaFoxyGames[from]
}


//Cooperativo Rango Foxy.
if (text.toLowerCase() === "!barcofoxy") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🦊 Foxy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🦊 Foxy." })
    }

    if (barcoFoxyGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay un Barco Pirata activo en este chat." })
    }

    barcoFoxyGames[from] = { players: [sender], progress: 0 }
    await sock.sendMessage(from, { text: "🏴‍☠️ *Barco Pirata iniciado*.\nMínimo 2 jugadores.\nUsa `!unirsebarco` para unirte." })
}

if (text.toLowerCase() === "!unirsebarco") {
    const game = barcoFoxyGames[from]
    if (!game) return

    if (game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "⚠️ Ya estás en el Barco Pirata." })
    }

    game.players.push(sender)
    await sock.sendMessage(from, { text: `✅ Te uniste al Barco Pirata.\nJugadores: ${game.players.length}` })
}

if (text.toLowerCase() === "!remar") {
    const game = barcoFoxyGames[from]
    if (!game) return

    if (!game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "❌ No estás en este juego. Usa `!unirsebarco`." })
    }

    game.progress += 1
    if (game.progress >= 6) {
        const reward = 20
        const xp = 25
        for (const p of game.players) {
            ensureUser(p)
            economy[p].fazcoins += reward
            await addXP(p, xp, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: `🏆 ¡El Barco Pirata llegó a su destino!\nCada jugador ganó *${reward} Fazcoins* 💰 y *${xp} XP* ⭐.` })
        delete barcoFoxyGames[from]
    } else {
        await sock.sendMessage(from, { text: `🚣‍♂️ Están remando... progreso: ${game.progress}/6` })
    }
}


// Cooperativo del rango Foxy
if (text.toLowerCase() === "!cazafoxy") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🦊 Foxy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🦊 Foxy." })
    }

    if (cazaFoxyGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay una Caza del Tesoro activa en este chat." })
    }

    cazaFoxyGames[from] = { players: [sender], excavaciones: 0 }
    await sock.sendMessage(from, { text: "🗺️ *Caza del Tesoro iniciada*.\nMínimo 2 jugadores.\nUsa `!unirsecaza` para unirte." })
}

if (text.toLowerCase() === "!unirsecaza") {
    const game = cazaFoxyGames[from]
    if (!game) return

    if (game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "⚠️ Ya estás en esta Caza del Tesoro." })
    }

    game.players.push(sender)
    await sock.sendMessage(from, { text: `✅ Te uniste a la Caza del Tesoro.\nJugadores: ${game.players.length}` })
}

if (text.toLowerCase() === "!excavar") {
    const game = cazaFoxyGames[from]
    if (!game) return

    if (!game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "❌ No estás en este juego. Usa `!unirsecaza`." })
    }

    game.excavaciones++
    if (game.excavaciones >= 5) {
        const reward = 25
        const xp = 30
        for (const p of game.players) {
            ensureUser(p)
            economy[p].fazcoins += reward
            await addXP(p, xp, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: `🏆 ¡Encontraron el Tesoro Maldito!\nCada jugador ganó *${reward} Fazcoins* 💰 y *${xp} XP* ⭐.` })
        delete cazaFoxyGames[from]
    } else {
        await sock.sendMessage(from, { text: `⛏️ Están excavando... progreso: ${game.excavaciones}/5` })
    }
}


//Cooperativo de Rango Foxy
if (text.toLowerCase() === "!batallafoxy") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🦊 Foxy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🦊 Foxy." })
    }

    if (batallaFoxyGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay una Batalla Naval activa en este chat." })
    }

    batallaFoxyGames[from] = { players: [sender], disparos: 0 }
    await sock.sendMessage(from, { text: "⚓ *Batalla Naval iniciada*.\nMínimo 2 jugadores.\nUsa `!unirsebatalla` para unirte." })
}

if (text.toLowerCase() === "!unirsebatalla") {
    const game = batallaFoxyGames[from]
    if (!game) return

    if (game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "⚠️ Ya estás en esta Batalla Naval." })
    }

    game.players.push(sender)
    await sock.sendMessage(from, { text: `✅ Te uniste a la Batalla Naval.\nJugadores: ${game.players.length}` })
}

if (text.toLowerCase() === "!disparar") {
    const game = batallaFoxyGames[from]
    if (!game) return

    if (!game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "❌ No estás en este juego. Usa `!unirsebatalla`." })
    }

    game.disparos++
    if (game.disparos >= 4) {
        const reward = 30
        const xp = 35
        for (const p of game.players) {
            ensureUser(p)
            economy[p].fazcoins += reward
            await addXP(p, xp, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: `🏆 ¡Hundieron al barco enemigo!\nCada jugador ganó *${reward} Fazcoins* 💰 y *${xp} XP* ⭐.` })
        delete batallaFoxyGames[from]
    } else {
        await sock.sendMessage(from, { text: `💥 Dispararon al barco enemigo... progreso: ${game.disparos}/4` })
    }
}

// 🎮 Juego individual: Sombras en el Pasillo
if (text.toLowerCase() === "!sombras") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🐻 Freddy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐻 Freddy." })
    }

    if (sombrasGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes un juego de *Sombras en el Pasillo* activo aquí." })
    }

    sombrasGames[from] = { player: sender }

    await sock.sendMessage(from, {
        text: "🌑 Te adentras en un pasillo oscuro...\nLas sombras se mueven. Escribe *!luzso* para encender tu linterna."
    })
}

if (text.toLowerCase() === "!luzso") {
    const game = sombrasGames[from]
    if (!game) return

    const win = Math.random() < 0.5
    if (win) {
        ensureUser(sender)
        economy[sender].fazcoins += 10
        await addXP(sender, 15, sock, from)
        saveEconomy()
        await sock.sendMessage(from, { text: "🔦 Lograste iluminar y las sombras huyeron.\nGanaste *10 Fazcoins* 💰 y *15 XP* ⭐" })
    } else {
        await sock.sendMessage(from, { text: "💀 La linterna falló... las sombras te atraparon." })
    }
    delete sombrasGames[from]
}

// 🎮 Juego individual: Campanas de Medianoche
if (text.toLowerCase() === "!campanas") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🐻 Freddy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🐻 Freddy." })
    }

    if (campanasGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes un juego de *Campanas de Medianoche* activo aquí." })
    }

    campanasGames[from] = { player: sender, pasos: 0 }

    await sock.sendMessage(from, {
        text: "🔔 La primera campanada de medianoche suena...\nEscribe *!escuchar* para resistir."
    })
}

if (text.toLowerCase() === "!escuchar") {
    const game = campanasGames[from]
    if (!game) return

    game.pasos++

    if (game.pasos >= 3) {
        ensureUser(sender)
        economy[sender].fazcoins += 15
        await addXP(sender, 25, sock, from)
        saveEconomy()
        await sock.sendMessage(from, { text: "🔔 Resististe todas las campanadas.\nGanaste *15 Fazcoins* 💰 y *25 XP* ⭐" })
        delete campanasGames[from]
    } else {
        await sock.sendMessage(from, {
            text: `🔔 Campanada ${game.pasos}...\nResiste escribiendo *!escuchar* nuevamente.`
        })
    }
}



// 🎮 Juego cooperativo: Puertas Encantadas
if (text.toLowerCase() === "!puertas") {
    if (puertasFreddyGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay unas *Puertas Encantadas* abiertas en este chat." })
    }

    puertasFreddyGames[from] = { players: [], abiertas: false }

    await sock.sendMessage(from, { text: "🚪 Las Puertas Encantadas aparecen...\nSe necesitan al menos 2 jugadores.\nUsa *!entrar* para unirte." })
}

if (text.toLowerCase() === "!entrar") {
    const game = puertasFreddyGames[from]
    if (!game) return

    if (game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "⚠️ Ya entraste a las Puertas Encantadas." })
    }

    game.players.push(sender)
    await sock.sendMessage(from, { text: `✅ ${sender} entró a las Puertas Encantadas.` })

    if (game.players.length >= 2 && !game.abiertas) {
        game.abiertas = true
        await sock.sendMessage(from, { text: "🚪 Las puertas se cierran detrás de ustedes...\nEscriban *!forzar* todos juntos para salir." })
    }
}

if (text.toLowerCase() === "!forzar") {
    const game = puertasFreddyGames[from]
    if (!game || !game.abiertas) return

    game.players = game.players.filter(p => p) // limpiar duplicados
    game.players.forEach(p => game[p] = game[p] || false)
    game[sender] = true

    const todos = game.players.every(p => game[p])
    if (todos) {
        for (const p of game.players) {
            ensureUser(p)
            economy[p].fazcoins += 15
            await addXP(p, 25, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: "💪 ¡Lograron forzar las puertas y escapar!\nTodos ganaron *15 Fazcoins* 💰 y *25 XP* ⭐" })
        delete puertasFreddyGames[from]
    }
}

// 🎮 Juego cooperativo: Ritual de Freddy
if (text.toLowerCase() === "!ritual") {
    if (ritualFreddyGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay un *Ritual de Freddy* activo en este chat." })
    }

    ritualFreddyGames[from] = { players: [], pasos: 0 }

    await sock.sendMessage(from, { text: "🔮 Ha comenzado el Ritual de Freddy.\nUsa *!invocar* para unirte.\nSe necesitan al menos 3 jugadores." })
}

if (text.toLowerCase() === "!invocar") {
    const game = ritualFreddyGames[from]
    if (!game) return

    if (game.players.includes(sender)) {
        return await sock.sendMessage(from, { text: "⚠️ Ya formas parte del ritual." })
    }

    game.players.push(sender)
    await sock.sendMessage(from, { text: `✨ ${sender} se unió al Ritual de Freddy.` })

    if (game.players.length >= 3) {
        game.pasos = 1
        await sock.sendMessage(from, { text: "🔮 El ritual comienza...\nTodos los jugadores deben escribir *!cantar*." })
    }
}

if (text.toLowerCase() === "!cantar") {
    const game = ritualFreddyGames[from]
    if (!game || game.pasos !== 1) return

    game[sender] = true

    const todos = game.players.every(p => game[p])
    if (todos) {
        for (const p of game.players) {
            ensureUser(p)
            economy[p].fazcoins += 20
            await addXP(p, 30, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: "🔮 ¡El Ritual de Freddy fue un éxito!\nTodos ganaron *20 Fazcoins* 💰 y *30 XP* ⭐" })
        delete ritualFreddyGames[from]
    }
}


   
// 🎮 Robo de batería (instantáneo, sin estado)
if (text.toLowerCase() === "!robobateria") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🎈 Balloon Boy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🎈 Balloon Boy." })
    }

    const resultado = Math.random() < 0.5 // 50% prob
    if (resultado) {
        user.fazcoins += 5
        await addXP(sender, 10, sock, from)
        saveEconomy()
        await sock.sendMessage(from, { text: "🔋 ¡Lograste robar una batería! Ganaste *5 Fazcoins* y *10 XP* ⭐" })
    } else {
        await sock.sendMessage(from, { text: "❌ Fallaste en robar la batería, intenta de nuevo más tarde." })
    }
}

// 🎮 Escondite con Balloon Boy
if (text.toLowerCase() === "!escondite") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🎈 Balloon Boy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🎈 Balloon Boy." })
    }

    if (esconditeGames[sender]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes un escondite activo. Usa *!buscar <lugar>* para jugar." })
    }

    const lugares = ["cortinas", "ventilación", "baúl"]
    const lugar = lugares[Math.floor(Math.random() * lugares.length)]

    esconditeGames[sender] = { lugar }
    await sock.sendMessage(from, { text: "🙈 Balloon Boy se escondió...\nUsa *!buscar cortinas*, *!buscar ventilación* o *!buscar baúl*." })
}

if (text.toLowerCase().startsWith("!buscar")) {
    const game = esconditeGames[sender]
    if (!game) {
        return await sock.sendMessage(from, { text: "❌ No estás jugando al escondite. Usa *!escondite* para empezar." })
    }

    const args = text.split(" ")
    const eleccion = args[1]

    if (!eleccion) {
        return await sock.sendMessage(from, { text: "⚠️ Debes elegir un lugar: *cortinas*, *ventilación* o *baúl*." })
    }

    if (eleccion.toLowerCase() === game.lugar) {
        ensureUser(sender)
        economy[sender].fazcoins += 8
        await addXP(sender, 15, sock, from)
        saveEconomy()
        await sock.sendMessage(from, { text: `✅ Encontraste a Balloon Boy en las *${game.lugar}*! Ganaste *8 Fazcoins* y *15 XP* ⭐` })
    } else {
        await sock.sendMessage(from, { text: `❌ Revisaste en *${eleccion}* pero Balloon Boy no estaba ahí.` })
    }

    delete esconditeGames[sender]
}

// 🎮 Eco de risas
if (text.toLowerCase() === "!eco") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🎈 Balloon Boy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🎈 Balloon Boy." })
    }

    if (ecoGames[sender]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya tienes un juego de eco en curso." })
    }

    const frases = [
        "Hi-hi-hi!",
        "Catch me!",
        "You can’t hide!",
        "Gotcha!"
    ]
    const frase = frases[Math.floor(Math.random() * frases.length)]

    ecoGames[sender] = { frase }
    await sock.sendMessage(from, { text: `🔊 Balloon Boy dice: *${frase}*\nRepite la frase usando *!decir <frase>* exactamente igual.` })
}

if (text.toLowerCase().startsWith("!decir")) {
    const game = ecoGames[sender]
    if (!game) {
        return await sock.sendMessage(from, { text: "❌ No estás jugando al eco. Usa *!eco* para empezar." })
    }

    const fraseDicha = text.slice(7) // todo lo que sigue después de "!decir "

    if (fraseDicha === game.frase) {
        ensureUser(sender)
        economy[sender].fazcoins += 7
        await addXP(sender, 12, sock, from)
        saveEconomy()
        await sock.sendMessage(from, { text: `✅ Repetiste bien el eco de Balloon Boy.\nGanaste *7 Fazcoins* y *12 XP* ⭐` })
    } else {
        await sock.sendMessage(from, { text: "❌ Fallaste en repetir el eco correctamente." })
    }

    delete ecoGames[sender]
}

if (text.toLowerCase() === "!risascoop") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🎈 Balloon Boy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🎈 Balloon Boy." })
    }

    if (risasCoopGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay un juego de risas colectivas en curso. Usa *!reir* para participar." })
    }

    risasCoopGames[from] = { jugadores: new Set(), contador: 0 }
    await sock.sendMessage(from, { text: "😂 Juego de *Risas Colectivas* iniciado.\nTodos deben escribir *!reir* al menos 3 veces en total (entre todos) para ganar la recompensa." })
}

if (text.toLowerCase() === "!reir") {
    const game = risasCoopGames[from]
    if (!game) return

    game.jugadores.add(sender)
    game.contador++

    if (game.contador >= 3) {
        for (const player of game.jugadores) {
            ensureUser(player)
            economy[player].fazcoins += 5
            await addXP(player, 8, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: `✅ ¡Todos rieron juntos! Los jugadores recibieron *5 Fazcoins* y *8 XP* ⭐` })
        delete risasCoopGames[from]
    } else {
        await sock.sendMessage(from, { text: `😂 Van ${game.contador}/3 risas acumuladas.` })
    }
}

// 🎮 Inflar globos
if (text.toLowerCase() === "!globoscoop") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🎈 Balloon Boy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🎈 Balloon Boy." })
    }

    if (globosCoopGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay un juego de globos en curso. Usa *!inflar* para participar." })
    }

    globosCoopGames[from] = { jugadores: new Set(), inflados: 0 }
    await sock.sendMessage(from, { text: "🎈 Juego de *Globos Cooperativos* iniciado.\nTodos deben usar *!inflar* hasta llegar a 5 globos." })
}

if (text.toLowerCase() === "!inflar") {
    const game = globosCoopGames[from]
    if (!game) return

    game.jugadores.add(sender)
    game.inflados++

    if (game.inflados >= 5) {
        for (const player of game.jugadores) {
            ensureUser(player)
            economy[player].fazcoins += 6
            await addXP(player, 10, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: `🎈 ¡Los globos se inflaron todos! Cada jugador recibió *6 Fazcoins* y *10 XP* ⭐` })
        delete globosCoopGames[from]
    } else {
        await sock.sendMessage(from, { text: `🎈 Han inflado ${game.inflados}/5 globos.` })
    }
}

// 🎮 Linterna compartida
if (text.toLowerCase() === "!linternacoop") {
    ensureUser(sender)
    const user = economy[sender]

    if (!hasAccessToGame(user, "🎈 Balloon Boy")) {
        return await sock.sendMessage(from, { text: "❌ Este minijuego es exclusivo para el rango 🎈 Balloon Boy." })
    }

    if (linternaCoopGames[from]) {
        return await sock.sendMessage(from, { text: "⚠️ Ya hay un juego de linterna en curso. Usa *!iluminar* para aportar energía." })
    }

    linternaCoopGames[from] = { jugadores: new Set(), energia: 0 }
    await sock.sendMessage(from, { text: "🔦 Juego de *Linterna Compartida* iniciado.\nLos jugadores deben usar *!iluminar* hasta acumular 4 energías." })
}

if (text.toLowerCase() === "!iluminar") {
    const game = linternaCoopGames[from]
    if (!game) return

    game.jugadores.add(sender)
    game.energia++

    if (game.energia >= 4) {
        for (const player of game.jugadores) {
            ensureUser(player)
            economy[player].fazcoins += 7
            await addXP(player, 12, sock, from)
        }
        saveEconomy()
        await sock.sendMessage(from, { text: `🔦 ¡Encendieron la linterna juntos! Cada jugador ganó *7 Fazcoins* y *12 XP* ⭐` })
        delete linternaCoopGames[from]
    } else {
        await sock.sendMessage(from, { text: `🔋 Energía acumulada: ${game.energia}/4.` })
    }
}

        // 💰 PERFIL
 if (text.toLowerCase() === "!perfil") {
    ensureUser(sender)
    const name = getName(sender, msg)
    const user = economy[sender]
    const avatarUrl = await resolveAvatarUrl(sock, sender)

    const xpRequired = getXPRequired(user.level)

    let caption = `👤 Perfil de *${name}*\n`
    caption += `💰 Fazcoins: ${user.fazcoins}\n`
    caption += `⭐ Nivel: ${user.level}\n`
    caption += `🎭 Rango: ${getRank(user.level)}\n`
    caption += `📊 XP: ${user.xp}/${xpRequired}\n\n`

    // 🛒 Inventario de rangos
    if (user.inventory && user.inventory.length > 0) {
        caption += `🎒 *Inventario:*\n${user.inventory.map(r => `- ${r}`).join("\n")}`
    } else {
        caption += "🛍️ Helpy abrió una nueva tienda...\nUsa *!tienda* para ver los artículos."
    }

    await sendImageSafe(sock, from, avatarUrl, caption)
}


        // 💰 TOP
        if (text.toLowerCase() === "!top") {
            if (Object.keys(economy).length === 0) {
                return await sock.sendMessage(from, { text: "📉 No hay jugadores en la economía todavía." })
            }

            const rankingEntries = Object.entries(economy)
                .sort((a, b) => b[1].fazcoins - a[1].fazcoins)
                .slice(0, 5)

            let rankingMsg = "🏆 *TOP 5 Jugadores* 🏆\n\n"
            for (let i = 0; i < rankingEntries.length; i++) {
                const [jid, data] = rankingEntries[i]
                const name = getName(jid, msg)
                rankingMsg += `#${i+1} 👤 ${name}\n💰 Fazcoins: ${data.fazcoins}\n\n`
            }

            await sock.sendMessage(from, { text: rankingMsg.trim() })
        }

        // 🎵 Descargar AUDIO (MP3)
        if (text.startsWith("!ytaudio")) {
            const query = text.replace("!ytaudio", "").trim()
            if (!query) return sock.sendMessage(from, { text: "❌ Ingresa un nombre o link de YouTube." })

            const url = await getYoutubeUrl(query)
            if (!url) return sock.sendMessage(from, { text: "❌ No encontré resultados." })

            const info = await ytdl.getInfo(url)
            const format = ytdl.chooseFormat(info.formats, { filter: "audioonly" })

            await sock.sendMessage(from, { 
                audio: { url: format.url }, 
                mimetype: "audio/mp4", 
                fileName: `${info.videoDetails.title}.mp3` 
            })
        }

        // 🎥 Descargar VIDEO (MP4)
        if (text.startsWith("!ytvideo")) {
            const query = text.replace("!ytvideo", "").trim()
            if (!query) return sock.sendMessage(from, { text: "❌ Ingresa un nombre o link de YouTube." })

            const url = await getYoutubeUrl(query)
            if (!url) return sock.sendMessage(from, { text: "❌ No encontré resultados." })

            const info = await ytdl.getInfo(url)
            const format = ytdl.chooseFormat(info.formats, { quality: "18" })

            await sock.sendMessage(from, { 
                video: { url: format.url }, 
                caption: `${info.videoDetails.title}` 
            })
        }

    })
}

startBot()