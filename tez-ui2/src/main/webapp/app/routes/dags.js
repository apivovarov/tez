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

import AbstractRoute from './abstract';

const REFRESH = {refreshModel: true};

export default AbstractRoute.extend({
  title: "All DAGs",

  queryParams: {
    dagName: REFRESH,
    dagID: REFRESH,
    submitter: REFRESH,
    status: REFRESH,
    appID: REFRESH,
    contextID: REFRESH,
    pageNo: REFRESH,

    rowCount: REFRESH,
  },

  loaderQueryParams: {
    dagName: "dagName",
    dagID: "dagID",
    user: "submitter",
    status: "status",
    appID: "appID",
    contextID: "contextID",

    pageNo: "pageNo",
    limit: "rowCount",
  },

  setupController: function (controller, model) {
    this._super(controller, model);
    Ember.run.later(this, "startCrumbBubble");
  },

  // Client side filtering to ensure that records are relevant after status correction
  filterRecords: function (records, query) {
    query = {
      name: query.dagName,
      entityID: query.dagID,
      submitter: query.submitter,
      status: query.status,
      appID: query.appID,
      contextID: query.contextID
    };

    return records.filter(function (record) {
      for(var propName in query) {
        if(query[propName] && query[propName] !== record.get(propName)) {
          return false;
        }
      }
      return true;
    });
  },

  load: function (value, query, options) {
    var loader,
        that = this;

    if(query.dagID) {
      that.set("loadedRecords", []);
      loader = this.get("loader").queryRecord('dag', query.dagID, options).then(function (record) {
        return [record];
      });
    }
    else {
      loader = this.get("loader").query('dag', query, options);
    }

    return loader.then(function (records) {
      return that.filterRecords(records, query);
    });
  },

  actions: {
    setLoadTime: function (time) {
      this.set("controller.loadTime", time);
    }
  }
});
