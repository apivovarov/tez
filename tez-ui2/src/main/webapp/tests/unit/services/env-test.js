/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { moduleFor, test } from 'ember-qunit';

import environment from '../../../config/environment';

moduleFor('service:env', 'Unit | Service | env', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

test('Basic creation test', function(assert) {
  let service = this.subject();

  assert.ok(service);
  assert.ok(service.collateConfigs);
  assert.ok(service.getConfig);
  assert.ok(service.getAppConfig);
});

test('collateConfigs test', function(assert) {
  let service = this.subject(),
      APP = environment.APP;

  APP.a = 11;
  APP.b = 22;
  window.ENV = {
    a: 1
  };

  service.collateConfigs();

  APP = service._configs.APP;
  assert.equal(APP.a, 1, "Test window.ENV merge onto environment.APP");
  assert.equal(APP.b, 22);
});

test('getConfig test', function(assert) {
  let service = this.subject();

  window.ENV = {};
  environment.a = 11;
  service.collateConfigs();
  assert.equal(service.getConfig("a"), environment.a);
});

test('getAppConfig test', function(assert) {
  let service = this.subject();

  window.ENV = {};
  environment.APP.a = 11;
  service.collateConfigs();
  assert.equal(service.getAppConfig("a"), environment.APP.a);
});
