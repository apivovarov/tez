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

import Ember from 'ember';

import UnlinkedPromise from '../../../errors/unlinked-promise';

import { moduleFor, test } from 'ember-qunit';

moduleFor('route:abstract', 'Unit | Route | abstract', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('Basic creation test', function(assert) {
  let route = this.subject();

  assert.ok(route);
  assert.ok(route.setDocTitle);
  assert.ok(route.setupController);
  assert.ok(route.beforeModel);

  assert.ok(route.checkAndCall);

  assert.ok(route.setLoading);
  assert.ok(route.loadData);
  assert.ok(route.beforeLoad);
  assert.ok(route.load);
  assert.ok(route.afterLoad);
  assert.ok(route.setValue);

  assert.ok(route._setControllerModel);
  assert.ok(route.setLoader);
});

test('beforeModel test', function(assert) {
  let route = this.subject(),
      testQueryParams = {};

  route.loadData = Ember.K;
  assert.notOk(route.queryParams.queryParams);
  route.beforeModel({queryParams: testQueryParams});
  assert.equal(route.queryParams, testQueryParams);
});

test('checkAndCall test', function(assert) {
  let route = this.subject(),
      testValue = {};

  assert.expect(2);

  route.testFunction = function (value) {
    assert.equal(value, testValue, "Call with current id");
  };
  route.currentPromiseId = 1;

  route.checkAndCall(1, "testFunction", testValue);
  assert.throws(function () {
    route.checkAndCall(2, "testFunction", testValue);
  });
});

test('loadData test - Hook sequence check', function(assert) {
  let route = this.subject();

  // Bind poilyfill
  Function.prototype.bind = function (context, val1, val2) {
    var that = this;
    return function (val) {
      return that.call(context, val1, val2, val);
    };
  };

  assert.expect(4 + 1);

  route.setLoading = function () {
    return 1;
  };
  route.beforeLoad = function (value) {
    assert.equal(value, 1, "beforeLoad");
    return ++value;
  };
  route.load = function (value) {
    assert.equal(value, 2, "load");
    return ++value;
  };
  route.afterLoad = function (value) {
    assert.equal(value, 3, "afterLoad");
    return ++value;
  };
  route.setValue = function (value) {
    assert.equal(value, 4, "setValue");
    return ++value;
  };

  route.loadData().then(function (value) {
    assert.equal(value, 5, "Value returned by loadData");
  });

});

test('loadData test - ID change check with exception throw', function(assert) {
  let route = this.subject();

  // Bind poilyfill
  Function.prototype.bind = function (context, val1, val2) {
    var that = this;
    return function (val) {
      return that.call(context, val1, val2, val);
    };
  };

  assert.expect(2 + 1);

  route.setLoading = function () {
    return 1;
  };
  route.beforeLoad = function (value) {
    assert.equal(value, 1, "beforeLoad");
    return ++value;
  };
  route.load = function (value) {
    assert.equal(value, 2, "load");

    route.currentPromiseId = 0;

    return ++value;
  };
  route.afterLoad = function (value) {
    assert.equal(value, 3, "afterLoad");
    return ++value;
  };
  route.setValue = function (value) {
    assert.equal(value, 4, "setValue");
    return ++value;
  };

  route.loadData().then(function () {
    assert.notOk("Shouldn't be called");
  }).catch(function (e) {
    assert.ok(e instanceof UnlinkedPromise, "Exception thrown");
  });
});

test('setLoading test', function(assert) {
  let route = this.subject();

  assert.equal(route.get("isLoading"), false);
  route.setLoading();
  assert.equal(route.get("isLoading"), true);
});

test('beforeLoad load afterLoad test', function(assert) {
  let route = this.subject(),
      testVal = {};

  assert.equal(route.beforeLoad(testVal), testVal);
  assert.equal(route.load(testVal), testVal);
  assert.equal(route.afterLoad(testVal), testVal);
});

test('setValue test', function(assert) {
  let route = this.subject(),
      testVal = {};

  route.setLoading();
  assert.equal(route.get("loadedValue"), null);
  assert.equal(route.get("isLoading"), true);
  assert.equal(route.setValue(testVal), testVal);
  assert.equal(route.get("loadedValue"), testVal);
  assert.equal(route.get("isLoading"), false);
});

test('_setControllerModel test', function(assert) {
  let route = this.subject(),
      testValue = {},
      testController = Ember.Object.create();

  route.set("loadedValue", testValue);
  route.set("controller", testController);

  assert.notOk(testController.model);
  route._setControllerModel();
  assert.equal(testController.model, testValue, "With controller");
});

test('setLoader test', function(assert) {
  let route = this.subject(),
      testNamespace = "tn",
      oldLoader = route.get("loader");

  route.setLoader(testNamespace);

  assert.notEqual(route.get("loader"), oldLoader);
  assert.equal(route.get("loader.nameSpace"), testNamespace);
  assert.equal(route.get("loader.store"), route.get("store"));
  assert.equal(route.get("loader.container"), route.get("container"));
});
