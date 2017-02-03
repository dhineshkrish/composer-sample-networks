/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const AdminConnection = require('@ibm/concerto-admin').AdminConnection;
const BusinessNetworkConnection = require('@ibm/concerto-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('@ibm/concerto-common').BusinessNetworkDefinition;
const path = require('path');

require('chai').should();

describe('DigitalLandTitle', () => {

    let adminConnection;
    let businessNetworkConnection;

    before(() => {
        adminConnection = new AdminConnection();
        return adminConnection.createProfile('testprofile', { type: 'embedded' })
            .then(() => {
                return adminConnection.connect('testprofile', 'WebAppAdmin', 'DJY27pEnl16d');
            })
            .then(() => {
                return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
            })
            .then((businessNetworkDefinition) => {
                return adminConnection.deploy(businessNetworkDefinition);
            })
            .then(() => {
                businessNetworkConnection = new BusinessNetworkConnection();
                return businessNetworkConnection.connect('testprofile', '@ibm/digitalproperty-network', 'WebAppAdmin', 'DJY27pEnl16d');
            });
    });

    describe('#onRegisterPropertyForSale', () => {

        it('should change the forSale flag from undefined to true', () => {

            // Create the existing LandTitle asset.
            let factory = businessNetworkConnection.getBusinessNetwork().getFactory();
            let landTitle = factory.newInstance('net.biz.digitalPropertyNetwork', 'LandTitle', 'TITLE_1');
            let person = factory.newInstance('net.biz.digitalPropertyNetwork', 'Person', 'PERSON_1');
            person.firstName = 'Test';
            person.lastName = 'User';
            landTitle.owner = person;
            landTitle.information = 'Some information';

            // Create the transaction.
            let transaction = factory.newTransaction('net.biz.digitalPropertyNetwork', 'RegisterPropertyForSale');
            transaction.title = factory.newRelationship('net.biz.digitalPropertyNetwork', 'LandTitle', 'TITLE_1');

            // Get the asset registry.
            return businessNetworkConnection.getAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle')
                .then((assetRegistry) => {

                    // Add the LandTitle asset to the asset registry.
                    return assetRegistry.add(landTitle)
                        .then(() => {

                            // Submit the transaction.
                            return businessNetworkConnection.submitTransaction(transaction);

                        })
                        .then(() => {

                            // Get the modified land title.
                            return assetRegistry.get('TITLE_1');

                        })
                        .then((modifiedLandTitle) => {

                            // Ensure the LandTitle has been modified correctly.
                            modifiedLandTitle.forSale.should.be.true;

                        });
                });

        });

    });

});