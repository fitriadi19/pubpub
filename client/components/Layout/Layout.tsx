import React from 'react';
import classNames from 'classnames';

import { Collection, Pub } from 'types';
import {
	LayoutBlock,
	LayoutOptions,
	LayoutPubsByBlock,
	resolveLayoutPubsByBlock,
} from 'utils/layout';
import { usePageContext } from 'utils/hooks';
import { assert, expect } from 'utils/assert';
import { usePageOnce } from 'utils/analytics/usePageOnce';

import LayoutPubs from './LayoutPubs';
import LayoutHtml from './LayoutHtml';
import LayoutBanner from './LayoutBanner';
import LayoutText from './LayoutText';
import LayoutPagesCollections from './LayoutPagesCollections';
import LayoutCollectionHeader from './LayoutCollectionHeader';
import LayoutSubmissionBanner from './LayoutSubmissionBanner';

require('./layout.scss');

type Props = LayoutOptions & {
	blocks: LayoutBlock[];
	id?: string;
	layoutPubsByBlock: LayoutPubsByBlock<Pub>;
	collection?: Collection;
};

const Layout = (props: Props) => {
	const { locationData, loginData, communityData, pageData, gdprConsent } = usePageContext();
	const { blocks, isNarrow, layoutPubsByBlock, id = '', collection } = props;
	const pubsByBlockId = resolveLayoutPubsByBlock(layoutPubsByBlock, blocks);

	/** Page track should only be done on mount & on client side */
	usePageOnce(() => {
		/** Only track actual page visits, not dashboard visits e.g. when editing a page */
		if (locationData.isDashboard) {
			return null;
		}

		const base = {
			communityId: communityData.id,
			communityName: communityData.title,
			communitySubdomain: communityData.subdomain,
			isProd: locationData.isProd,
		};

		if (collection) {
			return {
				event: 'collection' as const,
				title: collection.title,
				collectionId: collection.id,
				collectionTitle: collection.title,
				collectionSlug: collection.slug,
				collectionKind: expect(collection.kind),
				...base,
			};
		}

		assert(!!pageData);

		return {
			event: 'page' as const,
			pageSlug: pageData.slug,
			pageTitle: pageData.title,
			pageId: pageData.id,
			...base,
		};
	}, gdprConsent);

	const renderBlock = (block: LayoutBlock, index: number) => {
		if (block.type === 'pubs') {
			return (
				<div className="layout-pubs-block" key={index}>
					<LayoutPubs
						content={block.content}
						pubs={pubsByBlockId[block.id]}
						collectionId={collection && collection.id}
					/>
				</div>
			);
		}
		if (block.type === 'text') {
			return <LayoutText key={index} content={block.content} />;
		}
		if (block.type === 'html') {
			return <LayoutHtml key={index} content={block.content} />;
		}
		if (block.type === 'banner') {
			return (
				<LayoutBanner
					key={index}
					content={block.content}
					communityData={communityData}
					loginData={loginData}
					locationData={locationData}
				/>
			);
		}
		if (block.type === 'collections-pages') {
			return (
				<div className="layout-pages-block" key={index}>
					<LayoutPagesCollections
						content={block.content}
						pages={communityData.pages}
						collections={communityData.collections}
					/>
				</div>
			);
		}
		if (block.type === 'collection-header' && collection) {
			return (
				<LayoutCollectionHeader
					key={index}
					content={block.content}
					collection={collection}
				/>
			);
		}
		if (block.type === 'submission-banner') {
			return <LayoutSubmissionBanner key={index} content={block.content} />;
		}
		return null;
	};

	return (
		<div
			id={id}
			className={classNames(
				'layout-component',
				isNarrow && 'narrow',
				locationData.query.display === 'ultrawide' && 'ultrawide',
			)}
		>
			{blocks.map(renderBlock)}
		</div>
	);
};

export default Layout;
