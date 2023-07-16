var panels_that_are_updating = [];
const ws = new MQTTManager_WS();

function startNSPanelOtaUpdate(panel_id) {
  // $.post("http://" + ip_address + "/start_ota_update", function (data) {
  //   $("#modal-command-sent").addClass("is-active");
  // });
  ws.send_command("firmware_update_nspanels", { nspanels: [panel_id] }, null);
}

function startNSPanelTftUpdate(panel_id) {
  // $.post("http://" + ip_address + "/start_tft_ota_update", function (data) {
  //  $("#modal-command-sent").addClass("is-active");
  // });
  ws.send_command("tft_update_nspanels", { nspanels: [panel_id] }, null);
}

function rebootNSPanel(panel_id) {
  ws.send_command("reboot_nspanels", { nspanels: [panel_id] }, null);
}

function updateNSPanelsWarnings() {
  $.get("/api/get_nspanels_warnings", (data) => {
    data.panels.forEach((panel) => {
      let mac_selector = panel.nspanel.mac;
      mac_selector = mac_selector.replaceAll(":", "\\:");
      if (panel.warnings == "") {
        $("#nspanel_" + mac_selector + "_warnings").addClass("is-hidden");
      } else if (panel.warnings != "") {
        $("#nspanel_" + mac_selector + "_warnings").removeClass("is-hidden");
        $("#nspanel_" + mac_selector + "_warnings").attr(
          "data-tooltip",
          panel.warnings
        );
      }
    });
  });
}

function show_dropdown_menu(event) {
  $(this).closest(".dropdown").toggleClass("is-active");
  event.stopPropagation();
}

function update_nspanel_status(data) {
  if ("mac" in data) {
    let mac_selector = data.mac;
    mac_selector = mac_selector.replaceAll(":", "\\:");
    if ("state" in data) {
      var new_html = "";
      if (data.state == "online") {
        if ($("#online_offline_state_" + mac_selector).text() == "Offline") {
          // Current state is offline, just about to update to online. Check if the panel has any warnings.
          updateNSPanelsWarnings();
        }
        $("#online_offline_tag_parent_" + mac_selector).html(
          '<span class="tag is-success" id="online_offline_state_' +
            data.mac +
            '">Online</span>'
        );
      } else if (data.state == "offline") {
        $("#online_offline_tag_parent_" + mac_selector).html(
          '<span class="tag is-danger" id="online_offline_state_' +
            data.mac +
            '">Offline</span>'
        );
      } else {
        // Update panel tag to show update progress if any
        update_text = "";
        update_progress = 0;
        if (data.state == "updating_fw") {
          update_text = "Updating firmware";
          update_progress = data.progress;
        } else if (data.state == "updating_fs") {
          update_text = "Updating LittleFS";
          update_progress = data.progress;
        } else if (data.state == "updating_tft") {
          update_text = "Updating GUI";
          update_progress = data.progress;
        }

        var new_html =
          '<div class="tags has-addons"><span class="tag is-dark">' +
          update_text +
          '</span><span class="tag is-info">' +
          update_progress +
          "%</span></div>";
        $("#online_offline_tag_parent_" + mac_selector).html(new_html);
      }
    }
    if ("rssi" in data) {
      var new_rssi_classes = "";
      if (data.rssi <= -90) {
        new_rssi_classes = "mdi mdi-wifi-strength-1-alert";
      } else if (data.rssi <= -80) {
        new_rssi_classes = "mdi mdi-wifi-strength-1";
      } else if (data.rssi <= -67) {
        new_rssi_classes = "mdi mdi-wifi-strength-2";
      } else if (data.rssi <= -55) {
        new_rssi_classes = "mdi mdi-wifi-strength-3";
      } else {
        new_rssi_classes = "mdi mdi-wifi-strength-4";
      }
      $("#wifi_signal_strength_" + mac_selector).html(
        '<span class="' +
          new_rssi_classes +
          '" id="wifi_signal_strength_' +
          data.mac +
          '" title="' +
          data.rssi +
          ' dBm"></span>'
      );
    }

    if ("heap_used_pct" in data) {
      $("#heap_used_" + mac_selector)
        .text(data.heap_used_pct + "%")
        .text()
        .slice(-2);
    }

    if ("temperature" in data) {
      var temperature_unit = $("#temperature_" + mac_selector)
        .text()
        .slice(-2);
      $("#temperature_" + mac_selector).html(
        Math.round(data.temperature * 100) / 100 + " " + temperature_unit
      );
    }
  }
}

$(document).ready(function () {
  //connect_to_websocket();
  ws.register_message_handler((message) => {
    if ("type" in message) {
      if (message.type == "status" || message.type == "status_report") {
        update_nspanel_status(message.payload);
      }
    }
  });

  ws.register_on_connect_handler(() => {
    console.log("Connected to MQTTManager via websocket.");
    // Remove any connection error notification
    $("#failed_to_connect_error").remove();

    ws.send_command("get_nspanel_status", {}, (response) => {
      for (const [id, nspanel] of Object.entries(response.nspanels)) {
        update_nspanel_status(nspanel);
      }
    });
  });
  ws.register_on_close_handler(() => {
    console.log("Disconnected from MQTTManager via websocket.");
    if ($("#failed_to_connect_error").length == 0) {
      $("#notification_holder").append(
        '<div class="notification is-danger" id="failed_to_connect_error">Failed to connect to MQTTManager. Retrying...</div>'
      );
    }
  });
  ws.connect();

  $("#firmware_upload_file_input").change(function () {
    var fileName = $(this).val().replace("C:\\fakepath\\", "");
    $("#firmware_upload_file_name").html(fileName);
  });

  $("#data_upload_file_input").change(function () {
    var fileName = $(this).val().replace("C:\\fakepath\\", "");
    $("#data_upload_file_name").html(fileName);
  });

  $("#tft_upload_file_input").change(function () {
    var fileName = $(this).val().replace("C:\\fakepath\\", "");
    $("#tft_upload_file_name").html(fileName);
  });

  $(".dropdown").click(show_dropdown_menu);
  $(window).click(function () {
    $(".dropdown").removeClass("is-active");
  });

  updateNSPanelsWarnings();
});
