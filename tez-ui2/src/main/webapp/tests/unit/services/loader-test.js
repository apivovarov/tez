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

import { moduleFor, test } from 'ember-qunit';

moduleFor('service:loader', 'Unit | Service | loader', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

test('Basic creation test', function(assert) {
  let service = this.subject();

  assert.ok(service.cache);
  assert.ok(service.store);
  assert.ok(service._setOptions);

  assert.ok(service.checkRequisite);

  assert.ok(service.lookup);
  assert.ok(service.entityFor);

  assert.ok(service.getCacheKey);

  assert.ok(service.queryRecord);
  assert.ok(service.query);
});

test('_setOptions test', function(assert) {
  let service = this.subject();

  assert.equal(service.get("nameSpace"), '');

  service._setOptions({
    nameSpace: "ns"
  });

  assert.equal(service.get("nameSpace"), 'ns');
});

test('checkRequisite test', function(assert) {
  let service = this.subject(),
      testType = "type";

  assert.expect(3 + 3 + 2);

  // Not found
  service.store = {
    adapterFor: function (type) {
      assert.equal(type, testType);
    },
    serializerFor: function (type) {
      assert.equal(type, testType);
    }
  };
  assert.throws(function () {
    service.checkRequisite(testType);
  });

  // Not loader found
  service.store = {
    adapterFor: function (type) {
      assert.equal(type, testType);
      return {};
    },
    serializerFor: function (type) {
      assert.equal(type, testType);
      return {};
    }
  };
  assert.throws(function () {
    service.checkRequisite(testType);
  });

  service.store = {
    adapterFor: function (type) {
      assert.equal(type, testType);
      return { _isLoader: true };
    },
    serializerFor: function (type) {
      assert.equal(type, testType);
      return { _isLoader: true };
    }
  };

  service.checkRequisite(testType);
});

test('lookup test', function(assert) {
  let service = this.subject();

  assert.expect(1);

  service.container.lookup = function (fullName) {
    assert.equal(fullName, "typ:na-me");
  };

  service.lookup("typ", "NaMe");
});

test('entityFor test', function(assert) {
  let service = this.subject(),
      testName = "abc",
      entity;

  assert.expect(3 + 4 + 3);

  // All lookups fail
  service.lookup = function (type, name) {
    if(name === testName) {
      assert.equal(type, "entitie");
    }
    if(name === "entity") {
      assert.equal(type, "entitie");
    }
  };
  assert.throws(function () {
    service.entityFor(testName);
  }, "All lookups fail");

  // Default lookups succeeded
  service.lookup = function (type, name) {
    if(name === testName) {
      assert.equal(type, "entitie");
    }
    if(name === "entity") {
      assert.equal(type, "entitie");
      return {
        actualName: "entity"
      };
    }
  };
  entity = service.entityFor(testName);
  assert.equal(entity.actualName, "entity", "Default lookups succeeded");
  assert.equal(entity.name, testName, "Default lookups succeeded");

  // Primary lookups succeeded
  service.lookup = function (type, name) {
    if(name === testName) {
      assert.equal(type, "entitie");
      return {
        actualName: name
      };
    }
    if(name === "entity") {
      assert.equal(type, "entitie"); // Shouldn't be called
    }
  };
  entity = service.entityFor(testName);
  assert.equal(entity.name, testName, "Default lookups succeeded");
  assert.equal(entity.name, testName, "Default lookups succeeded");
});

test('getCacheKey test', function(assert) {
  let service = this.subject();

  assert.equal(service.getCacheKey("type"), "type");
  assert.equal(service.getCacheKey("type", {a:1}), 'type:{"a":1}');
  assert.equal(service.getCacheKey("type", null, 1), "type:1");
  assert.equal(service.getCacheKey("type", {a:1}, 1), 'type:1:{"a":1}');
});

test('queryRecord test', function(assert) {
  let service = this.subject(),
      testNameSpace = "ns",
      testQueryParams = {},
      testUrlParams = {},
      testType = "type",
      testRecord = {},
      testID = 1,
      cacheKey = service.getCacheKey(testType, testQueryParams, testID);

  assert.expect(3 + 5 + 3);

  service.nameSpace = testNameSpace;
  service.checkRequisite = Ember.K;
  service.entityFor = function (type) {
    assert.equal(type, testType);

    return {
      loadRelations: function (thisService, record) {
        assert.equal(thisService, service);
        assert.equal(record, testRecord);

        return record;
      }
    };
  };
  service.get("store").queryRecord = function (type, query) {
    assert.equal(type, testType);

    assert.equal(query.id, testID);
    assert.equal(query.nameSpace, testNameSpace);
    assert.equal(query.params, testQueryParams);
    assert.equal(query.urlParams, testUrlParams);

    return Ember.RSVP.resolve(testRecord);
  };

  service.cache = Ember.Object.create();
  assert.notOk(service.get("cache").get(cacheKey));
  service.queryRecord(testType, testID, testQueryParams, testUrlParams).then(function (record) {
    assert.equal(record, testRecord);
  });
  assert.ok(service.get("cache").get(cacheKey));
});

test('query test', function(assert) {
  let service = this.subject(),
      testNameSpace = "ns",
      testQueryParams = {},
      testUrlParams = {},
      testType = "type",
      testRecord = {},
      testRecords = [testRecord, testRecord],
      cacheKey = service.getCacheKey(testType, testQueryParams);

  assert.expect(1 + (2 + 2) + 4 + 3);

  service.nameSpace = testNameSpace;
  service.checkRequisite = Ember.K;
  service.entityFor = function (type) {
    assert.equal(type, testType);

    return {
      loadRelations: function (thisService, record) {
        assert.equal(thisService, service);
        assert.equal(record, testRecord);

        return record;
      }
    };
  };
  service.get("store").query = function (type, query) {
    assert.equal(type, testType);

    assert.equal(query.nameSpace, testNameSpace);
    assert.equal(query.params, testQueryParams);
    assert.equal(query.urlParams, testUrlParams);

    return Ember.RSVP.resolve(testRecords);
  };

  service.cache = Ember.Object.create();
  assert.notOk(service.get("cache").get(cacheKey));
  service.query(testType, testQueryParams, testUrlParams).then(function (records) {
    assert.equal(records, testRecords);
  });
  assert.ok(service.get("cache").get(cacheKey));
});
