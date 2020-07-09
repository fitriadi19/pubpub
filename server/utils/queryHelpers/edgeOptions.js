import {
	Community,
	ExternalPublication,
	includeUserModel,
	Pub,
	PubAttribution,
	Release,
} from 'server/models';

const getOptionsForIncludedPub = ({ includeCommunity }) => {
	return [
		includeCommunity && { model: Community, as: 'community' },
		{ model: Release, as: 'releases' },
		{
			model: PubAttribution,
			as: 'attributions',
			include: [includeUserModel({ as: 'user' })],
		},
	].filter((x) => x);
};

export const getPubEdgeIncludes = ({
	includeCommunityForPubs,
	includeTargetPub,
	includePub,
} = {}) => {
	return [
		includeTargetPub && {
			model: Pub,
			as: 'targetPub',
			include: getOptionsForIncludedPub({ includeCommunity: includeCommunityForPubs }),
		},
		includePub && {
			model: Pub,
			as: 'pub',
			include: getOptionsForIncludedPub({ includeCommunity: includeCommunityForPubs }),
		},
		{
			model: ExternalPublication,
			as: 'externalPublication',
		},
	].filter((x) => x);
};
