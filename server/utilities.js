import { Community, Collection, User } from './models';

export const getCommunity = (req)=> {
	const hostname = req.get('host').indexOf('localhost') > -1 || req.get('host').indexOf('ssl.pubpub.org') > -1
		? 'dev.pubpub.org'
		: req.get('host');

	return Community.findOne({
		where: {
			$or: [
				{ subdomain: hostname.replace('.pubpub.org', '') },
				{ domain: hostname }
			]
		},
		include: [
			{
				model: Collection,
				as: 'collections',
			},
			{
				model: User,
				as: 'admins',
				through: { attributes: [] },
				attributes: ['id', 'slug', 'fullName', 'initials', 'avatar'],
			}
		],
	});
};
