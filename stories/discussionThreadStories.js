import React from 'react';
import { storiesOf } from '@storybook/react';
import DiscussionThread from 'components/DiscussionThread/DiscussionThread';
import { discussions } from './_data';

const wrapperStyle = { width: 'calc(100% - 2em)', maxWidth: '350px', margin: '1em', boxShadow: '0px 0px 1px rgba(0, 0, 0, 0.25)', float: 'left', };

storiesOf('DiscussionThread', module)
.add('Default', () => (
	<div>
		<div style={wrapperStyle}>
			<DiscussionThread
				discussions={discussions[0]}
				slug={'my-article'}
			/>
		</div>
		<div style={wrapperStyle}>
			<DiscussionThread
				discussions={discussions[1]}
				slug={'my-article'}
			/>
		</div>
	</div>
));