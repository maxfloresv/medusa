const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras");
const validOptions = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];
const activeGames = new Set();

module.exports.run = async (bot, message, args, settings, { token }) => {
    const member = extras.getMember(message, args);

    if (activeGames.has(message.channel.id)) return message.channel.send("❌  Ya hay un juego activo en este canal. Espera a que termine o inícialo en otro.");
    else if (!member) return message.channel.send("❌  Debes especificar a un usuario para desafiarlo.");
    else {
        if (member.user.bot) return extras.new_error(message, "Ocurrió un error", "Regla 1: No puedes desafiar a un bot, te destrozaría en segundos.");
        else if (member.user.id === message.author.id) return extras.new_error(message, "Ocurrió un error", "¿Cómo vas a jugar contigo mismo? Dah...");
        else if (activeGames.has(message.author.id) || activeGames.has(member.user.id)) return extras.new_error(message, "Ocurrió un error", "Ese usuario ya está participando en un desafío."+
        " Espera un momento."); 
        
        activeGames.add(message.author.id);
        activeGames.add(member.user.id);
        activeGames.add(message.channel.id);

        const m = await message.channel.send(
            `🕹️  ${member.user}, **${message.author.username}** te invitó a jugar Tic-Tac-Toe. Acepta la solicitud con \`accept\` o recházala con \`reject\`.`
        );
    
        const filter = msg => { 
            return ["accept", "reject"].includes(msg.content.toLowerCase()) && msg.author.id === member.user.id
            || msg.content.toLowerCase() === "cancel" && msg.author.id === message.author.id; 
        };
        const collector = m.channel.createMessageCollector(filter, { max: 1, time: 25000 });
    
        collector.on("collect", async msg => {
            if (msg.content.toLowerCase() !== "accept") return;

            const transformRow = { "A": 0, "B": 1, "C": 2 };
            let board = [
                ["🔲", "🔲", "🔲"],
                ["🔲", "🔲", "🔲"],
                ["🔲", "🔲", "🔲"]
            ];

            let plays = 0;
            let playerBag = [member.user, message.author];
            let starter = playerBag[Math.floor(Math.random() * playerBag.length)];
            const embed = new MessageEmbed()
                .setTitle("Tic-Tac-Toe")
                .setFooter(`Turno de ${starter.username}`)
                .setColor(extras.color_general)
                .addField("Tablero:", `⬛ 🇦 🇧 🇨\n1️⃣ ${board[0].map(o => o).join(" ")}\n2️⃣ ${board[1].map(o => o).join(" ")}\n3️⃣ ${board[2].map(o => o).join(" ")}`);
    
            const game = await message.channel.send(embed);
            const filter = msg => { 
                return (playerBag.length === 2 && msg.author.id === starter.id || playerBag.length === 1 && msg.author.id === playerBag[0].id)
                && validOptions.includes(msg.content.toUpperCase()); 
            };
            const collector = game.channel.createMessageCollector(filter, { idle: 20000 });
            const userInfo = await bot.getUserData(member.user).catch(() => {});
    
            collector.on("collect", async msg => {
                msg.delete();
                msg.author === message.author ? player = token || "❌" : player = userInfo.token || "⭕";
        
                let composition = msg.content.split("");
                let column = parseInt(composition[1], 10) - 1;
                let row = transformRow[composition[0].toUpperCase()];
        
                if (board[column][row] !== "🔲") {
                    message.channel.send("❌  No puedes poner tu pieza ahí. Intenta con otra posición.").then(m => m.delete({ timeout: 5000 }));
                } else {
                    playerBag.splice(playerBag.indexOf(msg.author), 1);
                    board[column][row] = player;
                    plays++;
        
                    if (plays > 4) {
                        if (checkWinner(board) !== null) {
                            let embed = new MessageEmbed()
                                .setTitle("¡Juego terminado!")
                                .setDescription(`${msg.author.username} eligió: ${msg.content.toUpperCase()}.`)
                                .setColor(extras.color_success)
                                .addField("Tablero:", `⬛ 🇦 🇧 🇨\n1️⃣ ${board[0].map(o => o).join(" ")}\n2️⃣ ${board[1].map(o => o).join(" ")}\n3️⃣ ${board[2].map(o => o).join(" ")}`)
                                .addField("Ganador:", msg.author.username);
                            
                            await message.channel.send(embed);
                            return collector.stop();
                            
                        } else if (plays === 9 && checkWinner(board) === null) {
                            let embed = new MessageEmbed()
                                .setTitle("¡Juego terminado!")
                                .setDescription(`${msg.author.username} eligió: ${msg.content.toUpperCase()}.`)
                                .setColor(extras.color_general)
                                .addField("Tablero:", `⬛ 🇦 🇧 🇨\n1️⃣ ${board[0].map(o => o).join(" ")}\n2️⃣ ${board[1].map(o => o).join(" ")}\n3️⃣ ${board[2].map(o => o).join(" ")}`)
                                .addField("Resultado:", "¡Empate!");
                        
                            await message.channel.send(embed);
                            return collector.stop();
                        }
                    }
                    
                    if (playerBag.length === 0 && msg.author.id === message.author.id) playerBag.push(member.user);
                    else if (playerBag.length === 0 && msg.author.id === member.user.id) playerBag.push(message.author);
                    
                    const embed = new MessageEmbed()
                        .setTitle(`${msg.author.username} eligió: **${msg.content.toUpperCase()}**`)
                        .setFooter(`Turno de ${playerBag[0].username} | ${player === "❌" ? "⭕" : "❌"}`)
                        .setColor(extras.color_general)
                        .addField("Tablero:", `⬛ 🇦 🇧 🇨\n1️⃣ ${board[0].map(o => o).join(" ")}\n2️⃣ ${board[1].map(o => o).join(" ")}\n3️⃣ ${board[2].map(o => o).join(" ")}`);
        
                    game.edit(embed);
                }
            });

            collector.on("end", msg => {
                activeGames.delete(message.author.id);
                activeGames.delete(member.user.id);
                activeGames.delete(message.channel.id);
                if (msg.size === 0) return message.channel.send("❌  Juego terminado (hubo inactividad por 20 segundos).").then(m => m.delete({ timeout: 5000 }));
                else {
                    let embed = new MessageEmbed()
                        .setTitle("¡Juego terminado!")
                        .setColor(extras.color_error)
                        .addField("Tablero:", `⬛ 🇦 🇧 🇨\n1️⃣ ${board[0].map(o => o).join(" ")}\n2️⃣ ${board[1].map(o => o).join(" ")}\n3️⃣ ${board[2].map(o => o).join(" ")}`)

                    if (plays !== 9 && playerBag[0] === message.author) {
                        embed.addField("Ganador:", `**${member.user.username}**.\n${message.author.username} se quedó inactivo o asumió su derrota.`)
                        return message.channel.send(embed);
                    } else if (plays !== 9 && playerBag[0] === member.user) {
                        embed.addField("Ganador:", `**${message.author.username}**.\n${member.user.username} se quedó inactivo o asumió su derrota.`)
                        return message.channel.send(embed);
                    }
                    else return;
                }
            });
        });

        collector.on("end", msg => {
            m.delete();
            if (msg.size === 0 || msg.first().content.toLowerCase() !== "accept") {
                activeGames.delete(message.author.id);
                activeGames.delete(member.user.id);
                activeGames.delete(message.channel.id);
                return message.channel.send("❌  **Juego cancelado.** La solicitud expiró o uno de los dos no quiere jugar ahora.").then(m => m.delete({ timeout: 5000 }));
            }
        });
    }
}

function checkWinner(board) {
    let winner = null;
    for (let i = 0; i < 3; i++) {
        if (equalsThree(board[i][0], board[i][1], board[i][2])) {
            winner = board[i][0];
        }
    }
    for (let i = 0; i < 3; i++) {
        if (equalsThree(board[0][i], board[1][i], board[2][i])) {
            winner = board[0][i];
        }
    }
    if (equalsThree(board[0][0], board[1][1], board[2][2])) winner = board[0][0];
    if (equalsThree(board[2][0], board[1][1], board[0][2])) winner = board[2][0];

    return winner;
}

function equalsThree(a, b, c) {
    return (a !== "🔲" && a === b && b === c);
}


module.exports.help = {
    nombre: "tictactoe",
    aliases: ["ttt"]
}
