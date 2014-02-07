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

package org.apache.tez.dag.history.events;

import org.apache.tez.common.counters.TezCounters;
import org.apache.tez.dag.api.DagTypeConverters;
import org.apache.tez.dag.api.oldrecords.TaskAttemptState;
import org.apache.tez.dag.history.HistoryEvent;
import org.apache.tez.dag.history.HistoryEventType;
import org.apache.tez.dag.history.ats.EntityTypes;
import org.apache.tez.dag.history.utils.ATSConstants;
import org.apache.tez.dag.history.utils.DAGUtils;
import org.apache.tez.dag.records.TezTaskAttemptID;
import org.apache.tez.dag.recovery.records.RecoveryProtos.TaskAttemptFinishedProto;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class TaskAttemptFinishedEvent implements HistoryEvent {

  private TezTaskAttemptID taskAttemptId;
  private String vertexName;
  private long startTime;
  private long finishTime;
  private TaskAttemptState state;
  private String diagnostics;
  private TezCounters tezCounters;

  public TaskAttemptFinishedEvent(TezTaskAttemptID taId,
      String vertexName,
      long startTime,
      long finishTime,
      TaskAttemptState state,
      String diagnostics,
      TezCounters counters) {
    this.taskAttemptId = taId;
    this.vertexName = vertexName;
    this.startTime = startTime;
    this.finishTime = finishTime;
    this.state = state;
    this.diagnostics = diagnostics;
    tezCounters = counters;
  }

  public TaskAttemptFinishedEvent() {
  }

  @Override
  public HistoryEventType getEventType() {
    return HistoryEventType.TASK_ATTEMPT_FINISHED;
  }

  @Override
  public JSONObject convertToATSJSON() throws JSONException {
    JSONObject jsonObject = new JSONObject();
    jsonObject.put(ATSConstants.ENTITY, taskAttemptId.toString());
    jsonObject.put(ATSConstants.ENTITY_TYPE,
        EntityTypes.TEZ_TASK_ATTEMPT_ID.name());

    // Events
    JSONArray events = new JSONArray();
    JSONObject finishEvent = new JSONObject();
    finishEvent.put(ATSConstants.TIMESTAMP, finishTime);
    finishEvent.put(ATSConstants.EVENT_TYPE,
        HistoryEventType.TASK_ATTEMPT_FINISHED.name());
    events.put(finishEvent);
    jsonObject.put(ATSConstants.EVENTS, events);

    JSONObject otherInfo = new JSONObject();
    otherInfo.put(ATSConstants.START_TIME, startTime);
    otherInfo.put(ATSConstants.FINISH_TIME, finishTime);
    otherInfo.put(ATSConstants.TIME_TAKEN, (finishTime - startTime));
    otherInfo.put(ATSConstants.STATUS, state.name());
    otherInfo.put(ATSConstants.DIAGNOSTICS, diagnostics);
    otherInfo.put(ATSConstants.COUNTERS,
        DAGUtils.convertCountersToJSON(this.tezCounters));
    jsonObject.put(ATSConstants.OTHER_INFO, otherInfo);

    return jsonObject;
  }

  @Override
  public boolean isRecoveryEvent() {
    return true;
  }

  @Override
  public boolean isHistoryEvent() {
    return true;
  }

  public TaskAttemptFinishedProto toProto() {
    return TaskAttemptFinishedProto.newBuilder()
        .setTaskAttemptId(taskAttemptId.toString())
        .setState(state.ordinal())
        .setDiagnostics(diagnostics)
        .setFinishTime(finishTime)
        .setCounters(DagTypeConverters.convertTezCountersToProto(tezCounters))
        .build();
  }

  public void fromProto(TaskAttemptFinishedProto proto) {
    this.taskAttemptId = TezTaskAttemptID.fromString(proto.getTaskAttemptId());
    this.finishTime = proto.getFinishTime();
    this.state = TaskAttemptState.values()[proto.getState()];
    this.diagnostics = proto.getDiagnostics();
    this.tezCounters = DagTypeConverters.convertTezCountersFromProto(
        proto.getCounters());
  }

  @Override
  public void toProtoStream(OutputStream outputStream) throws IOException {
    toProto().writeDelimitedTo(outputStream);
  }

  @Override
  public void fromProtoStream(InputStream inputStream) throws IOException {
    TaskAttemptFinishedProto proto =
        TaskAttemptFinishedProto.parseDelimitedFrom(inputStream);
    fromProto(proto);
  }

  @Override
  public String toString() {
    return "vertexName=" + vertexName
        + ", taskAttemptId=" + taskAttemptId
        + ", startTime=" + startTime
        + ", finishTime=" + finishTime
        + ", timeTaken=" + (finishTime - startTime)
        + ", status=" + state.name()
        + ", diagnostics=" + diagnostics
        + ", counters="
        + tezCounters.toString()
            .replaceAll("\\n", ", ").replaceAll("\\s+", " ");
  }

}
