import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {PatchEvent, set, unset, setIfMissing} from 'part:@sanity/form-builder/patch-event'
import {FormBuilderInput} from 'part:@sanity/form-builder'

export default class Geolocation extends React.PureComponent {
	static propTypes = {
		type: PropTypes.shape({
			title: PropTypes.string,
			name: PropTypes.string
		}).isRequired,
		level: PropTypes.number,
		value: PropTypes.shape({}),
		onChange: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);

		this.addressData = this.props.value ? this.props.value.geoaddress : null;
		this.timeout = null;
		this.geocoder = null;
	}

	equalObjects(a, b) {
		return JSON.stringify(a) === JSON.stringify(b);
	}

	handleFieldChange = (field, fieldPatchEvent) => {
		const {onChange, type, value} = this.props;

		onChange(
			fieldPatchEvent
				.prefixAll(field.name)
				.prepend( setIfMissing({ _type: type.name }) )
		)
	}

	componentDidUpdate(prevProps) {
		if (!this.equalObjects(prevProps.value, this.props.value)) {
			clearTimeout(this.timeout);

			this.timeout = setTimeout(() => {
				this.timeout = null;
				this.updatedComponentCallback(this.props.value);
			}, 300);
		}
	}

	updatedComponentCallback(value) {
		if (value.geopoint) {		
			this.reverseGeocode(value.geopoint, results => {
				this.addressData = results;
				this.updateAddress();
			});
		} else {
			this.addressData = null;
			this.updateAddress();
		}
	}

	updateAddress(address) {
		const changeAddress = (data) => data !== null ? set(data, ['geoaddress']) : unset(['geoaddress']);

		this.props.onChange(
			PatchEvent.from(changeAddress(this.addressData))
		);
	}

	componentFinder(results, index) {
		let component = results.find(part => part.types.includes(index));
		return component && component.address_components ? component.address_components.find(part => part.types.includes(index)).long_name : '';
	}

	reverseGeocode(coordinates, callback) {
		this.geocoder.geocode({ 'location': coordinates }, (results, status) => {
			if (status === 'OK') {
				if (results[0]) {

					const street = () => {
						const address = results.find(part => part.types.includes('street_address'));

						if ( address ){
							const route = address.address_components.find(part => part.types.includes('route'));
		 					const number = address.address_components.find(part => part.types.includes('street_number'));

		 					return `${ route.long_name } ${ number.long_name }`;
						}

						return '';
					};

					const postal = this.componentFinder(results, 'postal_town');
					const city = this.componentFinder(results, 'locality');
					const country = this.componentFinder(results, 'country');

					callback({ 
						address: street(),
						city: city ? city : postal,
						country: country
					});
				}
			}
		})
	}

	focus() {}

	render() {
		const {type, value, level} = this.props;
		const addressString = this.addressData ? `${ this.addressData.address ? this.addressData.address + ' —' : '' } ${ this.addressData.city }, ${ this.addressData.country }` : 'No location set';

		if (window.google && !this.geocoder) {
			this.geocoder = new window.google.maps.Geocoder;
		}

		return (
			<FormField label={type.title} level={level} description={type.description}>
				<legend style={{ color: 'rgb(128, 128, 128)', marginTop: '-7px', marginBottom: '20px' }}>{ addressString }</legend>

				{ type.fields.map(field => (
					<FormBuilderInput
						key={field.name}
						type={field.type}
						value={value && value[field.name]}
						style={ { marginBottom: '25px' } }
						onChange={patchEvent => this.handleFieldChange(field, patchEvent)}
					/>
					))
				}
			</FormField>
			)
	}
}