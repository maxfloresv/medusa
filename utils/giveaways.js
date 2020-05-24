const Giveaway = require("../databases/model/giveaway.js");
const schedule = require("node-schedule");

async function saveGiveaway(response) {
    const {
        title, prize, winners, duration, guildId, messageId, channelId, endsOn
    } = response;
    const giveaway = new Giveaway({
        guildId,
        messageId,
        channelId,
        title,
        prize,
        winners,
        duration,
        endsOn,
        createdOn: new Date(),
    });
    return giveaway.save();
}

async function scheduleGiveaways(bot, giveaways) {
    for (i = 0; i < giveaways.length; i++) {
        const { channelId, messageId, endsOn, winners } = giveaways[i];
        schedule.scheduleJob(endsOn, async () => {
            const channel = bot.channels.cache.get(channelId);
            if (channel) {
                const message = await channel.messages.fetch(messageId);
                if (message) {
                    const { embeds, reactions } = message;
                    const reaction = reactions.cache.get("🎉");
                    const users = await getAllUsers(reaction);
                    const entries = users[0].filter(u => !u.bot).array();
                    if (embeds.length === 1) {
                        const embed = embeds[0];
                        let winner = await determineWinners(entries, winners);
                        winner = winner.map(user => user.toString()).join(" ");
                        embed.setDescription(`~~${embed.description}~~\n**Sorteo finalizado!** Los ganadores son: ${winner}`);
                        await message.edit(embed);
                    }
                }
            }
        });
    }
}

function determineWinners(users, max) {
    if (users.length <= max) return users;
    const numbers = new Set();
    const winnersArray = [];
    let i = 0;
    while (i < max) {
        const random = Math.floor(Math.random() * users.length);
        const selected = users[random];
        if (!numbers.has(random)) {
            winnersArray.push(selected);
            i++;
        }
        numbers.add(random);
    }
    return winnersArray;
}

async function getAllUsers(reaction) {
    let entries = [];
    let users = await reaction.users.fetch();
    entries = entries.concat(users);
    while (users.size === 100) {
        const { id } = users.last();
        users = await reaction.users.fetch({ after: id });
        entries = entries.concat(users);
    }
    return entries;
}

module.exports = {
    saveGiveaway,
    scheduleGiveaways
}
