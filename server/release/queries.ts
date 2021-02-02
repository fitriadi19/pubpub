import { Op } from 'sequelize';

import { Release, Doc, Discussion, DiscussionAnchor, sequelize } from 'server/models';
import { getPubDraftDoc, getPubDraftRef, editorSchema } from 'server/utils/firebaseAdmin';
import { createLatestPubExports } from 'server/export/queries';
import { createDoc } from 'server/doc/queries';
import { createUpdatedDiscussionAnchorForNewSteps } from 'server/discussionAnchor/queries';
import { Maybe, Release as ReleaseType, DefinitelyHas } from 'utils/types';
import { getStepsInChangeRange } from 'client/components/Editor';

type ReleaseErrorReason = 'merge-failed' | 'duplicate-release';
export class ReleaseQueryError extends Error {
	// eslint-disable-next-line no-useless-constructor
	constructor(reason: ReleaseErrorReason) {
		super(reason);
	}
}

const getStepsSinceLastRelease = async (
	draftRef: firebase.database.Reference,
	previousRelease: Maybe<ReleaseType>,
	currentHistoryKey: number,
) => {
	if (previousRelease) {
		const { historyKey: previousHistoryKey } = previousRelease;
		return getStepsInChangeRange(
			draftRef,
			editorSchema,
			previousHistoryKey + 1,
			currentHistoryKey,
		);
	}
	return [];
};

const createDiscussionAnchorsForRelease = async (
	pubId: string,
	previousRelease: Maybe<DefinitelyHas<ReleaseType, 'doc'>>,
	currentHistoryKey: number,
	postgresTransaction: any,
) => {
	const draftRef = await getPubDraftRef(pubId);
	if (previousRelease) {
		const steps = await getStepsSinceLastRelease(draftRef, previousRelease, currentHistoryKey);
		const flatSteps = steps.reduce((a, b) => [...a, ...b], []);
		const discussions = await Discussion.findAll({
			where: { pubId: pubId },
			attributes: ['id'],
		});
		const existingAnchors = await DiscussionAnchor.findAll({
			where: {
				discussionId: { [Op.in]: discussions.map((d) => d.id) },
				historyKey: previousRelease.historyKey,
			},
		});
		await Promise.all(
			existingAnchors.map((anchor) =>
				createUpdatedDiscussionAnchorForNewSteps(
					anchor,
					flatSteps,
					currentHistoryKey,
					postgresTransaction,
				),
			),
		);
	}
};

export const createRelease = async ({
	userId,
	pubId,
	historyKey,
	noteContent,
	noteText,
	createExports = true,
}) => {
	const mostRecentRelease = await Release.findOne({
		where: { pubId: pubId },
		order: [['historyKey', 'DESC']],
		include: [{ model: Doc, as: 'doc' }],
	});

	if (mostRecentRelease && mostRecentRelease.historyKey === historyKey) {
		throw new ReleaseQueryError('duplicate-release');
	}

	const { doc: nextDoc } = await getPubDraftDoc(pubId, historyKey);
	const release = await sequelize.transaction(async (txn) => {
		const docModel = await createDoc(nextDoc, txn);
		const [nextRelease] = await Promise.all([
			Release.create(
				{
					noteContent: noteContent,
					noteText: noteText,
					historyKey: historyKey,
					userId: userId,
					pubId: pubId,
					docId: docModel.id,
				},
				{ transaction: txn },
			),
			createDiscussionAnchorsForRelease(pubId, mostRecentRelease, historyKey, txn),
		]);
		return nextRelease;
	});

	if (createExports) {
		await createLatestPubExports(pubId);
	}

	return release.toJSON();
};