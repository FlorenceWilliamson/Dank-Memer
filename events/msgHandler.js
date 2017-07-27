const config = require('../config.json')
const aliases = require('../cmdConfig.json').aliases

const cooldowns = {
	active: {},
	times: require('../cmdConfig.json').cooldowns
}

exports.handleMeDaddy = async function (client, msg, utils) {

	if (msg.channel.type === 'dm' && msg.author.id !== client.user.id) {
		const badtweet = '<@172571295077105664> look at this idiot DMing me'

		client.shard.broadcastEval(`
					this.channels.has('326384964964974602') && this.channels.get('326384964964974602').send('BEDTWIET', { embed: {
    					title: 'A_TAG',
						description: 'ARGS',
						thumbnail: { url: 'A_AVA' },
						color: 0x4099FF,
						timestamp: new Date(),
						footer: { text: 'Author ID: A_ID' }
					} })`
						.replace(/A_TAG/g, msg.author.tag.replace(/'|"|`/g, ''))
						.replace(/A_ID/g, msg.author.id)
						.replace(/A_AVA/g, msg.author.avatarURL)
						.replace(/ARGS/g, msg.content.replace(/'|"|`/g, ''))
						.replace(/BEDTWIET/g, badtweet))
						.catch(err => console.log(`TWEET BROADCASTEVAL ERR: ${err.stack}`))
	}
	if (msg.author.bot ||
		client.ids.blocked.user.includes(msg.author.id) ||
		client.ids.blocked.channel.includes(msg.channel.id) ||
		client.ids.blocked.guild.includes(msg.guild.id)) {
		return
	}

	let command = msg.content.slice(config.prefix.length + 1).toLowerCase().split(' ')[0]
	const args = msg.content.split(' ').slice(2)

	if (msg.isMentioned(client.user.id) && msg.content.includes('help')) {
		return msg.channel.send(`Hello, ${msg.author.username}. My prefix is \`${config.prefix}\`. Example: \`${config.prefix} meme\``)
	}

	if (!msg.content.toLowerCase().startsWith(config.prefix) || !command) {
		return
	}

	if (!cooldowns.active[msg.author.id]) {
		cooldowns.active[msg.author.id] = []
	}

	if (aliases[command]) {
		command = aliases[command]
	}

	if (cooldowns.active[msg.author.id].includes(command)) {
		for (const i in Object.keys(utils.cdMsg)) {
			if (cooldowns.active[msg.author.id].includes(Object.keys(utils.cdMsg)[i]) && command === Object.keys(utils.cdMsg)[i]) {
				return msg.channel.send(utils.cdMsg[Object.keys(utils.cdMsg)[i]])
			} else if (i === Object.keys(utils.cdMsg).length - 1) {
				return msg.channel.send('This command is on cooldown. Donors get to use ALL commands much faster!')
			}
		}
	}

	if (!config.devs.includes(msg.author.id)) {
		cooldowns.active[msg.author.id].push(command)
	}

	setTimeout(() => {
		cooldowns.active[msg.author.id].splice(cooldowns.active[msg.author.id].indexOf(command), 1)
	}, client.ids.donors.donor1.concat(client.ids.donors.donor5, client.ids.donors.donor10).includes(msg.author.id) ? cooldowns.times[command] * 0.10 : cooldowns.times[command])

	try {
		delete require.cache[require.resolve(`../commands/${command}`)]
		if (!msg.channel.permissionsFor(client.user.id).has(['SEND_MESSAGES', 'EMBED_LINKS'])) {
			return
		}
		require(`../commands/${command}`).run(client, msg, args, utils, config)

	} catch (e) {
		if (e.stack.startsWith('Error: Cannot find module')) {
			return
		}
		return console.log(`${command}: ${e.message}`)
	}

}