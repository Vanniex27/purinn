const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Sunnie online 24/7 hien tai dang hoat dong binh thuong!\n');
}).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ]
});

let PREFIX = 'p?'; 
let warnDatabase = {};
let linkViolationCounter = {};
let securitySettings = { antiraid: false, antibot: false, antilink: false };

client.once('ready', () => {
    console.log(`🤖 Bot Sunnie da san sang! Dang nhap: ${client.user.tag}`);
});
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (securitySettings.antilink && /(https?:\/\/[^\s]+)/g.test(message.content)) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await message.delete().catch(() => null);
            if (!linkViolationCounter[message.author.id]) linkViolationCounter[message.author.id] = 0;
            linkViolationCounter[message.author.id]++;
            const count = linkViolationCounter[message.author.id];
            if (count < 3) {
                return message.channel.send(`⚠️ ${message.author}, hệ thống đang bật **Anti-Link**. Bạn không được gửi liên kết vi phạm! (Cảnh cáo gửi link lần: **${count}/2**, gửi lần thứ 3 sẽ bị **BAN** vĩnh viễn!)`).then(msg => setTimeout(() => msg.delete(), 6000));
            } else {
                const member = message.guild.members.resolve(message.author);
                if (member) {
                    await member.ban({ reason: 'Gửi liên kết quảng cáo vi phạm luật Anti-Link quá 3 lần.' })
                        .then(() => { message.channel.send(`⛔ Đã tự động **BAN** thành viên ${message.author.tag} do vi phạm luật gửi liên kết quảng cáo lần thứ 3.`); linkViolationCounter[message.author.id] = 0; })
                        .catch(() => message.channel.send(`❌ Không thể tự động ban ${message.author.tag}.`));
                }
            }
        }
    }
});

client.on('guildMemberAdd', async (member) => {
    if (member.user.bot && securitySettings.antibot) await member.kick('Hệ thống đang bật Anti-Bot. Cấm bot lạ tham gia server.').catch(() => null);
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (!oldMember.premiumSince && newMember.premiumSince) {
        const channel = newMember.guild.channels.cache.find(ch => ch.name.includes('boost') || ch.name.includes('chat-chung'));
        if (channel) {
            const embed = new EmbedBuilder().setColor('#f47fff').setTitle('✨ LAND OF THE SUN | SERVER BOOSTED ✨').setDescription(`💖 Cảm ơn **${newMember.user}** đã sử dụng công cụ Boost để nâng cấp Server! 🎉`).setThumbnail(newMember.user.displayAvatarURL({ dynamic: true })).setTimestamp();
            channel.send({ embeds: [embed] });
        }
    }
});

let banCounter = {};
client.on('guildBanAdd', async (ban) => {
    const auditLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: 22 });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;
    const { executor } = logEntry;
    if (executor.id === ban.guild.ownerId || executor.id === client.user.id) return;
    if (!banCounter[executor.id]) banCounter[executor.id] = 0;
    banCounter[executor.id]++;
    if (banCounter[executor.id] > 3) {
        const member = await ban.guild.members.fetch(executor.id).catch(() => null);
        if (member) await member.roles.set([]).catch(console.error);
    }
    setTimeout(() => { banCounter[executor.id] = 0; }, 10000);
});
// 📌 BẮT BUỘC: Điền ID tài khoản Discord của bạn vào giữa hai dấu nháy đơn:
let YOUR_ID = 'ĐIỀN_ID_CỦA_BẠN_VÀO_ĐÂY';

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'help' || command === 'menu') {
        const txtMenu = '**Prefix:** ' + PREFIX + '\n\n🛡️ **[ ꒰飾sᴇcuʀιтʏ໒꒱ ]**\n• `lock` / `unlock` : Khóa/Mở khóa kênh chat siêu tốc.\n• `ban @user <lý do>` : Trục xuất vĩnh viễn user phá hoại.\n• `unban <ID>` : Gỡ ban bằng ID số.\n• `timeout @user <thời_gian> <lý do>` : Khóa chat thành viên.\n• `untimeout @user` : Hủy cấm chat trước thời hạn.\n• `role @user @role` : Tự động Cấp hoặc Gỡ role nhanh cho người chơi.\n• `antiraid` / `antibot` / `antilink` : Bật/Tắt chế độ bảo vệ chạy ngầm.\n• `warn @user <lý do>` : Cảnh cáo thành viên vi phạm.\n• `prefix <dấu_mới>` : Thay đổi dấu lệnh của bot nhanh chóng.\n\n🛠️ **[ ꒰১ тooʟs ໒꒱ ]**\n• `serverinfo` : Kiểm tra thông tin, công cụ và thống kê cấp độ Boost.\n• `botinfo` : Xem tình trạng hoạt động và độ trễ (ping) của bot.';
        const embed = new EmbedBuilder().setColor('#FFFACD').setTitle('✨ LAND OF THE SUN ✨').setDescription(txtMenu).setFooter({ text: 'Hệ thống quản lý và bảo vệ độc quyền bởi Sunnie' });
        message.channel.send({ embeds: [embed] });
    }

    if (command === 'prefix') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ Chỉ có Quản trị viên tối cao mới có quyền thay đổi tiền tố gọi Bot!');
        const newPrefix = args;
        if (!newPrefix) return message.reply('📌 Cú pháp: `' + PREFIX + 'prefix <dấu_mới>`');
        PREFIX = newPrefix;
        message.reply('🎯 **[ THÀNH CÔNG ]** Tiền tố gọi Bot Sunnie hiện đã được đổi thành: **`' + PREFIX + '`**\n👉 Bây giờ hãy dùng lệnh: **`' + PREFIX + 'help`** để mở menu trợ giúp nhé!');
    }

    if (command === 'lock') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Bạn không có quyền quản lý kênh để dùng lệnh này!');
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }).then(() => message.channel.send('🔒︎lock!')).catch(() => message.reply('❌ Có lỗi xảy ra khi thực hiện khóa kênh.'));
    }

    if (command === 'unlock') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return;
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true }).then(() => message.channel.send('ꗃunlock!')).catch(() => message.reply('❌ Có lỗi xảy ra khi mở khóa kênh.'));
    }

    if (command === 'warn') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Bạn không có quyền sử dụng lệnh cảnh cáo này!');
        const user = message.mentions.users.first();
        const reason = args.slice(1).join(' ') || 'Không có lý do.';
        if (!user) return message.reply('📌 Cú pháp: `' + PREFIX + 'warn @username [lý do]`');
        if (!warnDatabase[user.id]) warnDatabase[user.id] = 0;
        warnDatabase[user.id]++;
        const currentWarns = warnDatabase[user.id];
        const warnEmbed = new EmbedBuilder().setColor('#FFFACD').setTitle('𓏲 ๋࣭  ࣪ ˖member bị cảnh cáo ೀ').setDescription('Người vi phạm: ' + user.toString() + '\nLý do: **' + reason + '**\nSố lần đã bị cảnh cáo: **' + currentWarns + '** lần.').setTimestamp().setFooter({ text: 'Người thực hiện: ' + message.author.tag });
        message.channel.send({ embeds: [warnEmbed] });
        const dmEmbed = new EmbedBuilder().setColor('#FFFACD').setTitle('⚠️ BẠN VỪA BỊ CẢNH CÁO TẠI SERVER ' + message.guild.name.toUpperCase() + ' ⚠️').setDescription('Bạn đã nhận một cảnh cáo từ Quản trị viên vì hành vi vi phạm.\n\n**Chi tiết vi phạm:**\n• Lý do: ' + reason + '\n• Tổng số lần bị cảnh cáo hiện tại: ' + currentWarns + ' lần.').setTimestamp();
        user.send({ embeds: [dmEmbed] }).catch(() => null);
    }

    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Bạn không có quyền!');
        const user = message.mentions.users.first();
        const reason = args.slice(1).join(' ') || 'Không có lý do.';
        if (!user) return message.reply('📌 Cú pháp: `' + PREFIX + 'ban @username [lý do]`');
        if (user.id === message.guild.ownerId || user.id === YOUR_ID) return message.reply('❌ **Hệ thống bảo vệ tối cao:** Bạn không được phép BAN Đấng Tối Cao (Chủ Server hoặc Người Tạo Bot)!');
        const member = message.guild.members.resolve(user);
        if (member) {
            const botHighestRole = message.guild.members.me.roles.highest;
            if (member.roles.highest.position >= botHighestRole.position) return message.reply(`❌ **Không thể BAN!** Vai trò cao nhất của **${member.user.username}** đang xếp cao hơn hoặc bằng vai trò của Bot.\n💡 *Sửa:* Kéo vai trò của Bot Sunnie lên vị trí trên cùng.`);
            await member.ban({ reason }).then(() => message.reply(`🏆 ⊹⦸⊹ Đã ban **${user.tag}** thành công | Lý do: ${reason}`)).catch(() => message.reply('❌ Có lỗi phân quyền xảy ra khi thực hiện lệnh cấm vĩnh viễn.'));
        }
    }

    if (command === 'unban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Bạn không có quyền!');
        const userId = args;
        if (!userId) return message.reply('📌 Cú pháp: `' + PREFIX + 'unban <ID_Tài_Khoản>`');
        message.guild.members.unban(userId).then(user => message.reply(`⊹✔⊹ đã gỡ ban thành công cho tài khoản: **${user.tag}**`)).catch(() => message.reply('❌ ID không nằm trong danh sách cấm hoặc không hợp lệ.'));
    }

    if (command === 'timeout') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ Bạn không có quyền phạt cấm chat thành viên!');
        const member = message.mentions.members.first();
        const durationStr = args;
        const reason = args.slice(2).join(' ') || 'Không có lý do.';
        if (!member || !durationStr) return message.reply('📌 Cú pháp: `' + PREFIX + 'timeout @user <10m hoặc 2h> [lý do]`');
        if (member.id === message.guild.ownerId || member.id === YOUR_ID) return message.reply('❌ **Hệ thống bảo vệ tối cao:** Bạn không được phép phạt cấm chat Đấng Tối Cao (Chủ Server hoặc Người Tạo Bot)!');
        let timeMs = durationStr.endsWith('m') ? parseInt(durationStr) * 60 * 1000 : durationStr.endsWith('h') ? parseInt(durationStr) * 3600 * 1000 : 0;
        if (timeMs === 0) return message.reply('❌ Định dạng thời gian sai! Vui lòng nhập đuôi `m` (phút) hoặc `h` (giờ). Ví dụ: `10m`, `2h`.');
        const botHighestRole = message.guild.members.me.roles.highest;
        if (member.roles.highest.position >= botHighestRole.position) return message.reply(`❌ **Lỗi cấp bậc (Role Hierarchy)!** Bot không thể timeout **${member.user.username}** vì vai trò của họ xếp cao hơn hoặc bằng vai trò của Bot.\n💡 *Sửa:* Kéo vai trò của Bot Sunnie lên vị trí cao trên cùng bảng danh sách vai trò nha!`);
        await member.timeout(timeMs, reason).then(() => message.reply('🤫 ⊹݁ ˖Ი𐑼⋆ timeout **' + member.user.tag + '** trong vòng **' + durationStr + '** | Lý do: ' + reason)).catch(() => message.reply('❌ Có lỗi hệ thống hoặc phân quyền xảy ra khi thực hiện lệnh phạt cấm chat.'));
    }

    if (command === 'untimeout') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;
        const member = message.mentions.members.first();
        if (!member) return message.reply('📌 Cú pháp: `' + PREFIX + 'untimeout @username`');
        const botHighestRole = message.guild.members.me.roles.highest;
        if (member.roles.highest.position >= botHighestRole.position) return message.reply('❌ Lỗi cấp bậc! Không thể gỡ phạt cho người có vai trò cao hơn bot.');
        await member.timeout(null).then(() => message.reply('(˶ˆᗜˆ˵) untimeout thành công cho **' + member.user.tag + '**.')).catch(() => message.reply('❌ Không thể gỡ phạt cấm chat cho thành viên này.'));
    }

    if (command === 'antiraid' || command === 'antibot' || command === 'antilink') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ Chỉ Quản trị viên tối cao mới bật được tính năng này!');
        securitySettings[command] = !securitySettings[command];
        let statusText = command === 'antiraid' ? (securitySettings[command] ? '(๑ᵔ⤙ᵔ๑) đã bật antiraid' : ' can đã tắt antiraid') : command === 'antibot' ? (securitySettings[command] ? 'a đã bật antibot' : '(ᵕ—ᴗ—) đã tắt antibot') : (securitySettings[command] ? '(˶˃ᆺ˂˶) đã bật antilink' : 'a đã tắt antilink');
        message.reply(statusText);
    }
    if (command === 'role') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ Bạn không có quyền quản lý vai trò để dùng lệnh này!');
        const member = message.mentions.members.first();
        const role = message.mentions.roles.first();
        if (!member || !role) return message.reply('📌 Cú pháp: `' + PREFIX + 'role @username @ten_role`');
        const botHighestRole = message.guild.members.me.roles.highest;
        if (role.position >= botHighestRole.position) return message.reply(`❌ **Không thể cấp role do lỗi Cấp Bậc Vai Trò (Role Hierarchy)!**\n💡 **Cách sửa:** Bạn phải vào *Cài đặt Máy chủ > Vai trò*, kéo vai trò của Bot Sunnie lên trên cùng bảng danh sách.`);
        try {
            if (member.roles.cache.has(role.id)) { await member.roles.remove(role); message.reply('💡 ૮ ྀིᴗ͈ . ᴗ͈ ྀིa đã gỡ role của ' + member.user.username + ' | Tên vai trò: **' + role.name + '**'); }
            else { await member.roles.add(role); message.reply('(˶˃ ˂˶) add role ' + role.name + ' cho ' + member.user.username + ' thành công! 🎉'); }
        } catch (error) { message.reply('❌ Có lỗi hệ thống xảy ra khi gán vai trò.'); }
    }

    if (command === 'serverinfo') {
        const totalMembers = message.guild.memberCount;
        const botCount = message.guild.members.cache.filter(m => m.user.bot).size;
        const embed = new EmbedBuilder().setColor('#FFFACD').setTitle('`🍮🥄 ˚₊ suɴɴιᴇ ʟᴀɴᴅ`').addFields(
                { name: ' ੭﹕﹒ᴀʟʟ мᴇмʙᴇʀs couɴт', value: '`' + totalMembers + ' người`', inline: false },
                { name: ' ੭﹕﹒мᴇмʙᴇʀs', value: '`' + (totalMembers - botCount) + ' người`', inline: false },
                { name: ' ੭﹕﹒ʙoтs', value: '`' + botCount + ' bot`', inline: false },
                { name: ' ੭﹕﹒ɴԍàʏ тнàɴн ʟậᴘ', value: '`' + message.guild.createdAt.toDateString() + '`', inline: false },
                { name: ' ੭﹕﹒ʙoosт ʟvʟ', value: '`Level ' + message.guild.premiumTier + '` (' + message.guild.premiumSubscriptionCount + ' Boosts)', inline: false }
            ).setTimestamp();
        message.channel.send({ embeds: [embed] });
    }

    if (command === 'botinfo') {
        const ping = Math.round(client.ws.ping);
        const uptime = Math.round(process.uptime());
        let hrs = Math.floor(uptime / 3600), mins = Math.floor((uptime % 3600) / 60), secs = uptime % 60;
        const embed = new EmbedBuilder().setColor('#FFFACD').setTitle('🍮🥄 ˚₊ ɴԍoᴀɴ xιɴн ιu củᴀ ᴀɴDRᴇA (˶˃ ᵕ ˂˶)').addFields(
                { name: '⚡ Độ trễ mạng (Ping)', value: '`' + ping + 'ms`', inline: true },
                { name: '⏱️ Thời gian đã chạy', value: '`' + hrs + 'h ' + mins + 'm ' + secs + 's`', inline: true },
                { name: '👑 ٩(ˊᗜˋ*) chủ', value: '`andrea`', inline: true } 
            ).setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
});

// 📌 HÃY XÓA CHỮ DƯỚI ĐÂY ĐI VÀ DÁN MÃ TOKEN THẬT CỦA BẠN VÀO GIỮA HAI DẤU NHÁY ĐƠN:
client.login('TOKEN_THẬT_CỦA_BẠN_Ở_ĐÂY');
