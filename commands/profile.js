const Discord = require("discord.js"),
      varios = require("../utils/extras.js"),
      Canvas = require('canvas'),
      canvas = Canvas.createCanvas(300, 300),
      ctx = canvas.getContext('2d'),
      path = require("path");
const cooldown = new Set();

const xpManager = require("../modules/xpLevelManager.js");

module.exports.run = async (bot, message, args, con) => {
    let usuario = message.author;
    let userMentioned = message.mentions.users.first() 
    || (message.guild.members.cache.get(args[0]) !== undefined ? message.guild.members.cache.get(args[0]).user : false);
    
    const fondo = await Canvas.loadImage(path.join(__dirname, "..", "images", "test2.png"))

    let userData; let avatar; let currentTotalXp; let currentLvl; 
    var countryFlag; var globalTop; var localTop; var badgeToLoad; var numPos; var reps; var xp; var nextLevelXp; var progress; var credits; var nameSize;

    if (!cooldown.has(message.author.id)) {
      if (!args[0]) {
        con.query(`SELECT * FROM userInfo WHERE id = '${message.author.id}'`, async (err, rows) => {
          if (!rows[0]) {
            con.query(`INSERT INTO userInfo (id) VALUES ('${message.author.id}')`, async (err, rows) => {
              con.query(`SELECT id, totalXp, pos FROM ( SELECT id, totalXp, country, ROW_NUMBER() OVER (ORDER BY totalXp DESC) AS pos FROM userInfo WHERE country = 'ND' ) AS t WHERE t.id = '${message.author.id}'`, (err, rows) => {
                localTop = `${rows[0].pos}`;
              });
              con.query(`SELECT id, totalXp, pos FROM ( SELECT id, totalXp, ROW_NUMBER() OVER (ORDER BY totalXp DESC) AS pos FROM userInfo ) AS t WHERE t.id = '${message.author.id}'`, (err, rows) => {
                globalTop = `${rows[0].pos}`;
              });
              // Default values for an unregistered user.
              badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_010.png"));
              countryFlag = await Canvas.loadImage(path.join(__dirname, "..", "images", "flags", "default.png"));
              avatar = await Canvas.loadImage(message.author.avatarURL({ format: 'png' }) !== null ? message.author.avatarURL({ format: 'png' }) : message.author.defaultAvatarURL);

              ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height)
              ctx.drawImage(badgeToLoad, 93, 120, 50, 54)
              ctx.drawImage(countryFlag, 110, 25, 25, 17)
              ctx.drawImage(countryFlag, 210, 199, 15, 10)
              ctx.drawImage(avatar, 18, 20, 76, 76)
              ctx.fillStyle = '#ffffff'
              ctx.font = '17px Raleway SemiBold'
              ctx.fillText("+0 reps", 173, 170)
              ctx.fillText(`#${globalTop}`, 130, 209)
              ctx.fillText(`#${localTop}`, 230, 209)
              if (userMentioned.username.length <= 8) ctx.font = '15px Raleway SemiBold', ctx.fillText(userMentioned.tag, 143, 39);
              else ctx.font = '15px Raleway SemiBold', ctx.fillText(userMentioned.username, 143, 39);        
              ctx.font = '30px Raleway SemiBold'
              ctx.fillText("1", 109, 156)  
              ctx.font = '11px Raleway Light'
              ctx.fillText((userMentioned.createdAt.toLocaleDateString()).split("-").reverse().join("/"), 134, 62)
              ctx.fillText((message.guild.member(userMentioned).joinedAt.toLocaleDateString()).split("-").reverse().join("/"), 221, 62)
              ctx.font = '12px Raleway Light'
              ctx.fillStyle = '#ffffff'
              ctx.fillText("0/289 EXP", 165, 88)
              ctx.fillText("Insignias:", 128, 249)
              ctx.font = "15px Raleway SemiBold"
              ctx.font = "22px Raleway Light"
              ctx.fillText("Nivel", 33, 155)
              ctx.font = "15px Raleway Light"
              ctx.fillText("Global ranking:", 25, 208)
              ctx.font = '17px Raleway SemiBold'
              ctx.fillStyle = '#bcc888'
              ctx.fillText("$0", 205, 139)
              
              let attachment = new Discord.MessageAttachment(canvas.toBuffer());
              return await message.channel.send(attachment);
            });

          } else {
            con.query(`SELECT id, totalXp, pos FROM ( SELECT id, totalXp, country, ROW_NUMBER() OVER (ORDER BY totalXp DESC) AS pos FROM userInfo WHERE country = '${rows[0].country}' ) AS t WHERE t.id = '${message.author.id}'`, (err, rows) => {
              localTop = `${rows[0].pos}`;
            });
            con.query(`SELECT id, totalXp, pos FROM ( SELECT id, totalXp, ROW_NUMBER() OVER (ORDER BY totalXp DESC) AS pos FROM userInfo ) AS t WHERE t.id = '${message.author.id}'`, (err, rows) => {
              globalTop = `${rows[0].pos}`;
            });
            currentLvl = `${rows[0].level}`;
            xp = `${rows[0].xp}`;
            credits = convertCredits(rows[0].credits);
            reps = `${rows[0].reps}`;
            if (rows[0].level == 1) nextLevelXp = 289;
            else nextLevelXp = xpManager.calculateLevelXp(rows[0].level + 1) - xpManager.calculateLevelXp(rows[0].level);
            progress = "▇".repeat(progressBar(Math.round(xp / nextLevelXp * 100)));
  
            if (rows[0].level < 10) numPos = 109, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_010.png"));
            else if (rows[0].level >= 10 && rows[0].level < 20) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_1020.png"));
            else if (rows[0].level >= 20 && rows[0].level < 30) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_2030.png"));
            else if (rows[0].level >= 30 && rows[0].level < 40) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_3040.png"));
            else if (rows[0].level >= 40 && rows[0].level < 50) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_4050.png"));
            else if (rows[0].level >= 50 && rows[0].level < 60) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_5060.png"));
            else if (rows[0].level >= 60 && rows[0].level < 70) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_6070.png"));
            else if (rows[0].level >= 70 && rows[0].level < 80) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_7080.png"));
            else if (rows[0].level >= 80 && rows[0].level < 90) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_8090.png"));
            else if (rows[0].level >= 90 && rows[0].level < 100) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_90100.png"));
            else numPos = 95, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_master.png"));

            switch (rows[0].country) {
              case "ND": countryFlag = await Canvas.loadImage(path.join(__dirname, "..", "images", "flags", "default.png")); break;
              default: countryFlag = await Canvas.loadImage(path.join(__dirname, "..", "images", "flags", `${rows[0].country}.png`))
            }

            avatar = await Canvas.loadImage(message.author.avatarURL({ format: 'png' }) !== null ? message.author.avatarURL({ format: 'png' }) : message.author.defaultAvatarURL);

            con.query(`SELECT * FROM badges WHERE id = '${message.author.id}'`, async (err, rows) => {
              // Defaults if the user isn't registered in the badges table.
              if (!rows[0]) {
                ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height)
                ctx.drawImage(badgeToLoad, 93, 120, 50, 54)
                ctx.drawImage(countryFlag, 110, 25, 25, 17)
                ctx.drawImage(countryFlag, 210, 199, 15, 10)
                ctx.drawImage(avatar, 18, 20, 76, 76)
                ctx.fillStyle = '#ffffff'
                ctx.font = '17px Raleway SemiBold'
                ctx.fillText(`+${reps} reps`, 173, 170)
                ctx.fillText(`#${globalTop}`, 130, 209)
                ctx.fillText(`#${localTop}`, 230, 209)
                if (message.author.username.length <= 8) ctx.font = '15px Raleway SemiBold', ctx.fillText(message.author.tag, 143, 39);
                else ctx.font = '15px Raleway SemiBold', ctx.fillText(message.author.username, 143, 39);        
                ctx.font = '30px Raleway SemiBold'
                ctx.fillText(currentLvl, numPos, 156)  
                ctx.font = '11px Raleway Light'
                ctx.fillText((message.author.createdAt.toLocaleDateString()).split("-").reverse().join("/"), 134, 62)
                ctx.fillText((message.guild.member(message.author).joinedAt.toLocaleDateString()).split("-").reverse().join("/"), 221, 62)
                ctx.font = '12px sans-serif, segoe-ui-emoji'
                ctx.fillStyle = "#ff66a7"   
                ctx.fillText(progress, 112, 87)
                ctx.font = '12px Raleway SemiBold'
                ctx.fillStyle = '#ffffff'
                if (`${xp}/${nextLevelXp} EXP`.length <= 12) ctx.fillText(`${xp}/${nextLevelXp} EXP`, 165, 88);
                else ctx.fillText(`${xp}/${nextLevelXp} EXP`, 154, 88);
                ctx.fillText("Insignias:", 128, 249)
                ctx.font = "15px Raleway SemiBold"
                ctx.font = "22px Raleway Light"
                ctx.fillText("Nivel", 33, 155)
                ctx.font = "15px Raleway Light"
                ctx.fillText("Global ranking:", 25, 208)
                ctx.font = '17px Raleway SemiBold'
                ctx.fillStyle = '#bcc888'
                ctx.fillText(`$${credits}`, 205, 139)
                
                let attachment = new Discord.MessageAttachment(canvas.toBuffer());
                return await message.channel.send(attachment);

              } else {
                ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height)
                ctx.drawImage(badgeToLoad, 93, 120, 50, 54)
                ctx.drawImage(countryFlag, 110, 25, 25, 17)
                ctx.drawImage(countryFlag, 210, 199, 15, 10)
                ctx.drawImage(avatar, 18, 20, 76, 76)

                // Checking badge positions.
                if (rows[0].pos1 != "None") 
                  badgeOne = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos1}.png`)),
                  ctx.drawImage(badgeOne, 188, 228, 32, 30);
                if (rows[0].pos2 != "None") 
                  badgeTwo = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos2}.png`)),
                  ctx.drawImage(badgeTwo, 220, 228, 32, 30);
                if (rows[0].pos3 != "None") 
                  badgeThree = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos3}.png`)),
                  ctx.drawImage(badgeThree, 252, 228, 32, 30);
                if (rows[0].pos4 != "None") 
                  badgeFour = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos4}.png`)),
                  ctx.drawImage(badgeFour, 124, 258, 32, 30);
                if (rows[0].pos5 != "None") 
                  badgeFive = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos5}.png`)),
                  ctx.drawImage(badgeFive, 156, 258, 32, 30);
                if (rows[0].pos6 != "None") 
                  badgeSix = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos6}.png`)),
                  ctx.drawImage(badgeSix, 188, 258, 32, 30);
                if (rows[0].pos7 != "None") 
                  badgeSeven = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos7}.png`)),
                  ctx.drawImage(badgeSeven, 220, 258, 32, 30);
                if (rows[0].pos8 != "None") 
                  badgeEight = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos8}.png`)),
                  ctx.drawImage(badgeEight, 252, 258, 32, 30);
                if (rows[0].posfeatured != "None") 
                  badgeFeatured = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].posfeatured}.png`)),
                  ctx.drawImage(badgeFeatured, 50, 230, 62, 58);
  
                ctx.fillStyle = '#ffffff'
                ctx.font = '17px Raleway SemiBold'
                ctx.fillText(`+${reps} reps`, 173, 170)
                ctx.fillText(`#${globalTop}`, 130, 209)
                ctx.fillText(`#${localTop}`, 230, 209)
                if (message.author.username.length <= 8) ctx.font = '15px Raleway SemiBold', ctx.fillText(message.author.tag, 143, 39);
                else ctx.font = '15px Raleway SemiBold', ctx.fillText(message.author.username, 143, 39);        
                ctx.font = '30px Raleway SemiBold'
                ctx.fillText(currentLvl, numPos, 156)  
                ctx.font = '11px Raleway Light'
                ctx.fillText((message.author.createdAt.toLocaleDateString()).split("-").reverse().join("/"), 134, 62)
                ctx.fillText((message.guild.member(message.author).joinedAt.toLocaleDateString()).split("-").reverse().join("/"), 221, 62)
                ctx.font = '12px sans-serif, segoe-ui-emoji'
                ctx.fillStyle = "#ff66a7"   
                ctx.fillText(progress, 112, 87)
                ctx.font = '12px Raleway SemiBold'
                ctx.fillStyle = '#ffffff'
                if (`${xp}/${nextLevelXp} EXP`.length <= 12) ctx.fillText(`${xp}/${nextLevelXp} EXP`, 165, 88);
                else ctx.fillText(`${xp}/${nextLevelXp} EXP`, 154, 88);
                ctx.fillText("Insignias:", 128, 249)
                ctx.font = "15px Raleway SemiBold"
                ctx.font = "22px Raleway Light"
                ctx.fillText("Nivel", 33, 155)
                ctx.font = "15px Raleway Light"
                ctx.fillText("Global ranking:", 25, 208)
                ctx.font = '17px Raleway SemiBold'
                ctx.fillStyle = '#bcc888'
                ctx.fillText(`$${credits}`, 205, 139)
                
                let attachment = new Discord.MessageAttachment(canvas.toBuffer());
                return await message.channel.send(attachment);
              }
            });
          }
        });
  
      } else if (userMentioned) {
        con.query(`SELECT * FROM userInfo WHERE id = '${userMentioned.id}'`, async (err, rows) => {
          if (!rows[0]) {
            con.query(`INSERT INTO userInfo (id) VALUES ('${userMentioned.id}')`, async (err, rows) => {
              con.query(`SELECT id, totalXp, pos FROM ( SELECT id, totalXp, country, ROW_NUMBER() OVER (ORDER BY totalXp DESC) AS pos FROM userInfo WHERE country = 'ND' ) AS t WHERE t.id = '${userMentioned.id}'`, (err, rows) => {
                localTop = `${rows[0].pos}`;
              });
              con.query(`SELECT id, totalXp, pos FROM ( SELECT id, totalXp, ROW_NUMBER() OVER (ORDER BY totalXp DESC) AS pos FROM userInfo ) AS t WHERE t.id = '${userMentioned.id}'`, (err, rows) => {
                globalTop = `${rows[0].pos}`;
              });
              // Default values for an unregistered user.
              badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_010.png"));
              countryFlag = await Canvas.loadImage(path.join(__dirname, "..", "images", "flags", "default.png"));
              avatar = await Canvas.loadImage(userMentioned.avatarURL({ format: 'png' }) !== null ? userMentioned.avatarURL({ format: 'png' }) : userMentioned.defaultAvatarURL);

              ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height)
              ctx.drawImage(badgeToLoad, 93, 120, 50, 54)
              ctx.drawImage(countryFlag, 110, 25, 25, 17)
              ctx.drawImage(countryFlag, 210, 199, 15, 10)
              ctx.drawImage(avatar, 18, 20, 76, 76)
              ctx.fillStyle = '#ffffff'
              ctx.font = '17px Raleway SemiBold'
              ctx.fillText("+0 reps", 173, 170)
              ctx.fillText(`#${globalTop}`, 130, 209)
              ctx.fillText(`#${localTop}`, 230, 209)
              if (userMentioned.username.length <= 8) ctx.font = '16px Raleway SemiBold', ctx.fillText(userMentioned.tag, 143, 39);
              else ctx.font = '16px Raleway SemiBold', ctx.fillText(userMentioned.username, 143, 39);        
              ctx.font = '30px Raleway SemiBold'
              ctx.fillText("1", 109, 156)  
              ctx.font = '12px Raleway Light'
              ctx.fillText((userMentioned.createdAt.toLocaleDateString()).split("-").reverse().join("/"), 134, 62)
              ctx.fillText((message.guild.member(userMentioned).joinedAt.toLocaleDateString()).split("-").reverse().join("/"), 221, 62)
              ctx.font = '12px Raleway Light'
              ctx.fillStyle = '#ffffff'
              ctx.fillText("0/289 EXP", 165, 88)
              ctx.fillText("Insignias:", 130, 247)
              ctx.font = "15px Raleway SemiBold"
              ctx.font = "22px Raleway Light"
              ctx.fillText("Nivel", 33, 155)
              ctx.font = "15px Raleway Light"
              ctx.fillText("Global ranking:", 25, 208)
              ctx.font = '17px Raleway SemiBold'
              ctx.fillStyle = '#bcc888'
              ctx.fillText("$0", 205, 139)
              
              let attachment = new Discord.MessageAttachment(canvas.toBuffer());
              return await message.channel.send(attachment);
            });

          } else { 
            con.query(`SELECT id, totalXp, pos FROM ( SELECT id, totalXp, country, ROW_NUMBER() OVER (ORDER BY totalXp DESC) AS pos FROM userInfo WHERE country = '${rows[0].country}' ) AS t WHERE t.id = '${userMentioned.id}'`, (err, rows) => {
              localTop = `${rows[0].pos}`;
            });
            con.query(`SELECT id, totalXp, pos FROM ( SELECT id, totalXp, ROW_NUMBER() OVER (ORDER BY totalXp DESC) AS pos FROM userInfo ) AS t WHERE t.id = '${userMentioned.id}'`, (err, rows) => {
              globalTop = `${rows[0].pos}`;
            });
            currentLvl = `${rows[0].level}`;
            xp = `${rows[0].xp}`;
            credits = convertCredits(rows[0].credits);
            reps = `${rows[0].reps}`;
            if (rows[0].level == 1) nextLevelXp = 289;
            else nextLevelXp = xpManager.calculateLevelXp(rows[0].level + 1) - xpManager.calculateLevelXp(rows[0].level);
            progress = "▇".repeat(progressBar(Math.round(xp / nextLevelXp * 100)));
  
            if (rows[0].level < 10) numPos = 109, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_010.png"));
            else if (rows[0].level >= 10 && rows[0].level < 20) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_1020.png"));
            else if (rows[0].level >= 20 && rows[0].level < 30) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_2030.png"));
            else if (rows[0].level >= 30 && rows[0].level < 40) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_3040.png"));
            else if (rows[0].level >= 40 && rows[0].level < 50) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_4050.png"));
            else if (rows[0].level >= 50 && rows[0].level < 60) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_5060.png"));
            else if (rows[0].level >= 60 && rows[0].level < 70) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_6070.png"));
            else if (rows[0].level >= 70 && rows[0].level < 80) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_7080.png"));
            else if (rows[0].level >= 80 && rows[0].level < 90) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_8090.png"));
            else if (rows[0].level >= 90 && rows[0].level < 100) numPos = 102, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_90100.png"));
            else numPos = 95, badgeToLoad = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", "badge_master.png"));

            switch (rows[0].country) {
              case "ND": countryFlag = await Canvas.loadImage(path.join(__dirname, "..", "images", "flags", "default.png")); break;
              default: countryFlag = await Canvas.loadImage(path.join(__dirname, "..", "images", "flags", `${rows[0].country}.png`));
            }

            avatar = await Canvas.loadImage(userMentioned.avatarURL({ format: 'png' }) !== null ? userMentioned.avatarURL({ format: 'png' }) : userMentioned.defaultAvatarURL);

            con.query(`SELECT * FROM badges WHERE id = '${userMentioned.id}'`, async (err, rows) => {
              if (!rows[0]) {
                ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height)
                ctx.drawImage(badgeToLoad, 93, 120, 50, 54)
                ctx.drawImage(countryFlag, 110, 25, 25, 17)
                ctx.drawImage(countryFlag, 210, 199, 15, 10)
                ctx.drawImage(avatar, 18, 20, 76, 76)
                ctx.fillStyle = '#ffffff'
                ctx.font = '17px Raleway SemiBold'
                ctx.fillText(`+${reps} reps`, 173, 170)
                ctx.fillText(`#${globalTop}`, 130, 209)
                ctx.fillText(`#${localTop}`, 230, 209)
                if (userMentioned.username.length <= 8) ctx.font = '15px Raleway SemiBold', ctx.fillText(userMentioned.tag, 143, 39);
                else ctx.font = '15px Raleway SemiBold', ctx.fillText(userMentioned.username, 143, 39);        
                ctx.font = '30px Raleway SemiBold'
                ctx.fillText(currentLvl, numPos, 156)  
                ctx.font = '12px Raleway Light'
                ctx.fillText((userMentioned.createdAt.toLocaleDateString()).split("-").reverse().join("/"), 134, 62)
                ctx.fillText((message.guild.member(userMentioned).joinedAt.toLocaleDateString()).split("-").reverse().join("/"), 221, 62)
                ctx.font = '12px sans-serif, segoe-ui-emoji'
                ctx.fillStyle = "#ff66a7"   
                ctx.fillText(progress, 112, 87)
                ctx.font = '12px Raleway SemiBold'
                ctx.fillStyle = '#ffffff'
                ctx.fillText(`${xp}/${nextLevelXp} EXP`, 165, 88)
                ctx.fillText("Insignias:", 130, 247)
                ctx.font = "15px Raleway SemiBold"
                ctx.font = "22px Raleway Light"
                ctx.fillText("Nivel", 33, 155)
                ctx.font = "15px Raleway Light"
                ctx.fillText("Global ranking:", 25, 208)
                ctx.font = '17px Raleway SemiBold'
                ctx.fillStyle = '#bcc888'
                ctx.fillText(`$${credits}`, 205, 139)
                
                let attachment = new Discord.MessageAttachment(canvas.toBuffer());
                return await message.channel.send(attachment);
              
              } else {
                ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height)
                ctx.drawImage(badgeToLoad, 93, 120, 50, 54)
                ctx.drawImage(countryFlag, 110, 25, 25, 17)
                ctx.drawImage(countryFlag, 210, 199, 15, 10)
                ctx.drawImage(avatar, 18, 20, 76, 76)

                if (rows[0].pos1 != "None") 
                  badgeOne = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos1}.png`)),
                  ctx.drawImage(badgeOne, 188, 228, 32, 30);
                if (rows[0].pos2 != "None") 
                  badgeTwo = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos2}.png`)),
                  ctx.drawImage(badgeTwo, 220, 228, 32, 30);
                if (rows[0].pos3 != "None") 
                  badgeThree = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos3}.png`)),
                  ctx.drawImage(badgeThree, 252, 228, 32, 30);
                if (rows[0].pos4 != "None") 
                  badgeFour = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos4}.png`)),
                  ctx.drawImage(badgeFour, 124, 258, 32, 30);
                if (rows[0].pos5 != "None") 
                  badgeFive = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos5}.png`)),
                  ctx.drawImage(badgeFive, 156, 258, 32, 30);
                if (rows[0].pos6 != "None") 
                  badgeSix = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos6}.png`)),
                  ctx.drawImage(badgeSix, 188, 258, 32, 30);
                if (rows[0].pos7 != "None") 
                  badgeSeven = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos7}.png`)),
                  ctx.drawImage(badgeSeven, 220, 258, 32, 30);
                if (rows[0].pos8 != "None") 
                  badgeEight = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].pos8}.png`)),
                  ctx.drawImage(badgeEight, 252, 258, 32, 30);
                if (rows[0].posfeatured != "None") 
                  badgeFeatured = await Canvas.loadImage(path.join(__dirname, "..", "images", "badges", `${rows[0].posfeatured}.png`)),
                  ctx.drawImage(badgeFeatured, 50, 230, 62, 58);

                ctx.fillStyle = '#ffffff'
                ctx.font = '17px Raleway SemiBold'
                ctx.fillText(`+${reps} reps`, 173, 170)
                ctx.fillText(`#${globalTop}`, 130, 209)
                ctx.fillText(`#${localTop}`, 230, 209)
                if (userMentioned.username.length <= 8) ctx.font = '15px Raleway SemiBold', ctx.fillText(userMentioned.tag, 143, 39);
                else ctx.font = '15px Raleway SemiBold', ctx.fillText(userMentioned.username, 143, 39);        
                ctx.font = '30px Raleway SemiBold'
                ctx.fillText(currentLvl, numPos, 156)  
                ctx.font = '12px Raleway Light'
                ctx.fillText((userMentioned.createdAt.toLocaleDateString()).split("-").reverse().join("/"), 134, 62)
                ctx.fillText((message.guild.member(userMentioned).joinedAt.toLocaleDateString()).split("-").reverse().join("/"), 221, 62)
                ctx.font = '12px sans-serif, segoe-ui-emoji'
                ctx.fillStyle = "#ff66a7"   
                ctx.fillText(progress, 112, 87)
                ctx.font = '12px Raleway SemiBold'
                ctx.fillStyle = '#ffffff'
                ctx.fillText(`${xp}/${nextLevelXp} EXP`, 165, 88)
                ctx.fillText("Insignias:", 130, 247)
                ctx.font = "15px Raleway SemiBold"
                ctx.font = "22px Raleway Light"
                ctx.fillText("Nivel", 33, 155)
                ctx.font = "15px Raleway Light"
                ctx.fillText("Global ranking:", 25, 208)
                ctx.font = '17px Raleway SemiBold'
                ctx.fillStyle = '#bcc888'
                ctx.fillText(`$${credits}`, 205, 139)
                
                let attachment = new Discord.MessageAttachment(canvas.toBuffer());
                return await message.channel.send(attachment);
              }

            });
          }
        });

      } else if (args[0] == 'progress') {
        let commandsUsed = await db.fetch(`commandsUsed_${message.author.id}`),
        creditsGained = await db.fetch(`userBalance_${message.author.id}`),
        commandGoal = 0,
        creditsGoal = 0;
  
        commandsUsed === null ? commandsUsed = 0 : commandsUsed
        creditsGained === null ? creditsGained = 0 : creditsGained
        commandsUsed < 100 ? commandGoal = 100 : commandGoal
        creditsGained < 10000 ? creditsGoal = 10000 : creditsGoal
  
        let usuario = message.author;
        let embed_userProgress = new Discord.RichEmbed()
        .setThumbnail(usuario.avatarURL != null ? usuario.avatarURL : bot.user.avatarURL)    
        .setDescription(':mag_right: **Progreso de ' + usuario.tag + '**.\n> ¡Gana insignias para tu perfil completando metas!')
        .setFooter('Para revisar tus insignias, usa m!profile badges.', bot.user.avatarURL)
        .addField('Comandos usados:', `${commandsUsed}/${commandGoal}`, true)
        .addField('Créditos ganados:', `${creditsGained}/${creditsGoal}`, true)
        .addField('Reps dados:', `Próximamente`, true)    
        .setColor(varios.color_general);
        message.channel.send(embed_userProgress);
 
      } else {
        let embed = new Discord.MessageEmbed()
          .setDescription(varios.red_x + ` ${usuario}, ¡ese no es un argumento válido!`)
          .setFooter('Usa m!help profile para más información.', bot.user.avatarURL)
          .setColor(varios.color_error)
        message.channel.send(embed);
      }

    } else {
      message.delete();
      message.channel.send(`:notepad_spiral:  **|  ${message.author.tag}**, debes esperar \`60 segundo(s)\` para usar el comando de nuevo.`).then(m => m.delete({ timeout: 10000 }));
    }

    cooldown.add(message.author.id);
    setTimeout(() => {
      cooldown.delete(message.author.id);
    }, 1000); // cambiar a 60s
}

function progressBar(value) {
  if (value >= 0 && value <= 10) value = 1;
  else if (value >= 10 && value <= 20) value = 3;
  else if (value >= 20 && value <= 30) value = 4;
  else if (value >= 30 && value <= 40) value = 5;
  else if (value >= 40 && value <= 50) value = 6;
  else if (value >= 50 && value <= 60) value = 8;
  else if (value >= 60 && value <= 70) value = 9;
  else if (value >= 70 && value <= 80) value = 10;
  else if (value >= 80 && value <= 90) value = 11;
  else if (value >= 90 && value < 100) value = 13;
  else if (value >= 100) value = 14;
  return value;
}

function convertCredits(value) {
  if (value >= 1000000) value = (value / 1000000).toFixed(2) + "M";
  else if (value >= 99950) value = (value / 1000).toFixed(0) + "K";
  else if (value >= 9950) value = (value / 1000).toFixed(1) + "K";
  else if (value >= 1000) value = (value / 1000).toFixed(2) + "K";
  return value;
}

module.exports.help = {
  nombre: "profile"
}
