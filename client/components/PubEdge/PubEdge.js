import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit/Button';

import { Byline } from 'components';
import { usePageContext } from 'utils/hooks';
import { formatDate } from 'utils/dates';
import { pubUrl, pubShortUrl } from 'utils/canonicalUrls';
import { getPubPublishedDate } from 'utils/pub/pubDates';

import { pubEdgeType } from './constants';
import PubEdgeLayout from './PubEdgeLayout';

require('./pubEdge.scss');

export const propTypes = {
	actsLikeLink: PropTypes.bool,
	pubEdge: pubEdgeType.isRequired,
	viewingFromTarget: PropTypes.bool,
};

const defaultProps = {
	actsLikeLink: false,
	viewingFromTarget: false,
};

const getUrlForPub = (pubData, communityData) => {
	if (communityData.id === pubData.communityId) {
		return pubUrl(communityData, pubData);
	}
	if (pubData.community) {
		return pubUrl(pubData.communityId, pubData);
	}
	return pubShortUrl(pubData);
};

const getValuesFromPubEdge = (pubEdge, communityData, viewingFromTarget) => {
	const { externalPublication, targetPub, pub } = pubEdge;
	const displayedPub = viewingFromTarget ? pub : targetPub;
	if (displayedPub) {
		const { title, description, attributions, avatar } = displayedPub;
		const url = getUrlForPub(displayedPub, communityData);
		return {
			contributors: attributions,
			title: title,
			description: description,
			avatar: avatar,
			publicationDate: getPubPublishedDate(displayedPub),
			url: url,
		};
	}
	if (externalPublication) {
		const {
			title,
			description,
			contributors,
			avatar,
			url,
			publicationDate,
		} = externalPublication;
		return {
			title: title,
			description: description,
			contributors: contributors,
			avatar: avatar,
			url: url,
			publicationDate: publicationDate,
		};
	}
	return {};
};

const PubEdge = (props) => {
	const { actsLikeLink, pubEdge, viewingFromTarget } = props;
	const [open, setOpen] = useState(false);
	const { communityData } = usePageContext();

	const { avatar, contributors, description, publicationDate, title, url } = getValuesFromPubEdge(
		pubEdge,
		communityData,
		viewingFromTarget,
	);

	const publishedAt = formatDate(publicationDate);

	const handleToggleDescriptionClick = useCallback(
		(e) => {
			if (e.type === 'click' || e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
				setOpen(!open);
			}
		},
		[open],
	);

	const handleClick = useCallback(
		(e) => {
			if (e.type === 'click' || e.key === 'Enter') {
				window.open(url, '_top');
			}
		},
		[url],
	);

	const linkLikeProps = actsLikeLink && {
		onClick: handleClick,
		onKeyDown: handleClick,
		role: 'link',
		tabIndex: '0',
	};

	const maybeLink = (element, restProps = {}) => {
		if (actsLikeLink) {
			return element;
		}
		return (
			<a href={url} {...restProps}>
				{element}
			</a>
		);
	};

	return (
		<PubEdgeLayout
			outerElementProps={linkLikeProps}
			className={classNames('pub-edge-component', actsLikeLink && 'acts-like-link')}
			topLeftElement={avatar && maybeLink(<img src={avatar} alt="" />, { tabIndex: '-1' })}
			titleElement={maybeLink(title)}
			bylineElement={<Byline contributors={contributors} />}
			metadataElements={[
				description && (
					<Button
						as="a"
						onClick={handleToggleDescriptionClick}
						onKeyDown={handleToggleDescriptionClick}
						tabIndex="0"
					>
						{open ? 'Hide Description' : 'Show Description'}
					</Button>
				),
				<>Published on {publishedAt}</>,
				<a href={url} alt={title} tabIndex="0">
					{url}
				</a>,
			]}
			detailsElement={
				<details open={open}>
					<summary>Description</summary>
					<hr />
					<p>{description}</p>
				</details>
			}
		/>
	);
};

PubEdge.propTypes = propTypes;
PubEdge.defaultProps = defaultProps;
export default PubEdge;
