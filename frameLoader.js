/**
	MIT License

	Copyright (c) 2016 Daniel Budde

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

//
//	Plugin Name:	frameLoader
//	Author(s):		Daniel Budde
//	Created:		05/12/2016
//
//


// Verify jQuery is available and that the window supports messaging.
if (jQuery != undefined && window.postMessage != undefined)
{
	(
		function($, window, document, undefined)
		{
			/*************************/
			/*     Define Widget     */
			/*************************/
			var frameLoaderDefinition =
			{
				/*************************/
				/*    Default Options    */
				/*************************/
				options: {},




				/*************************/
				/*    Public Methods     */
				/*************************/
				/*
				pubMethod: function()
				{
					
				},
				*/




				/*************************/
				/*    Private Methods    */
				/*************************/
				_create: function()
				{
					var $el = this.element,
						$scriptTag = $(scriptTag),
						$this = this,
						classes = "",
						height = null,
						margin = null,
						origin = "",
						source = "";

					// Read in source for the iFrame
					source = this._getSource($scriptTag);


					// Read in external class for iFrame
					if (this._isType($scriptTag.data("class")))
					{
						classes = $scriptTag.data("class");
					}


					// Read in external margin for iFrame
					if (this._isType($scriptTag.data("margin"), "number"))
					{
						this._margin = Number($scriptTag.data("margin"));
					}


					// Read in external height for iFrame
					if (this._isType($scriptTag.data("height"), "number"))
					{
						height = Number($scriptTag.data("height"));
					}


					// Set iFrame properties if there is source
					if (source.length > 3)
					{
						origin = this._parseOrigin(source);

						if (origin.length > 0)
						{
							// Once iFrame loads, perform the following
							$el.on(
								"load", 
								function()
								{
									if (!$this._frameInitialLoadComplete)
									{
										$this._frameInitialLoadComplete = true;
									}


									$this._registrationComplete = false;
									
									$this._registerParentWithFrame.apply($this, []);
									$this._installResizer();
								}
							);

							if (classes.length > 0)
							{
								$el.addClass(classes);
							}

							$el.css("overflow", "hidden");
							$el[0].scrolling = "no";

							$el[0].id = this._createFrameID();

							if (this._isType(height, "number"))
							{
								$el.height(height);
							}

							$el[0].src = source;

							this._frameID = $el[0].id;

							$(window).messenger("registerWindow", this._frameID, $el[0].contentWindow, origin, false);

							this._initEvents();
						}
					}


					// Destroy iFrame and code if there was nothing to load.
					if ($el[0].src.length <= 0)
					{
						$el.frameLoader("destroy");
					}
				},


				_createFrameID: function()
				{
					var $el = null,
						counter = 1,
						id = "",
						number = 1,
						prefix = "loadedFrame";


					id = prefix + "01";
					$el = $("#" + id);

					while ($el.length > 0)
					{
						counter++;
						number = counter;

						if (String(number).length == 1)
						{
							number = "0" + number;
						}

						id = prefix + number;
						$el = $("#" + id);
					}

					return id;
				},


				_destroy: function()
				{
					this.element.remove();
					$(scriptTag).remove();
				},


				_getSource: function($scriptTag)
				{
					var source = $scriptTag.data("src");

					if (this._isType($scriptTag.data("source"), "string"))
					{
						source = $scriptTag.data("source");
					}

					if (!this._isType(source, "string"))
					{
						source = "";
					}

					return source;
				},


				_initEvents: function()
				{
					var $this = this;


					$(window).on(
						"messageReceived",
						function(ev, message, id)
						{
							if (id === "frameLoader")
							{
								$this._processMessage.apply($this, [message]);
							}
						}
					);
				},


				_installResizer: function()
				{
					var method = function(frameID, frameMargin)
					{
						var fID = frameID,
							lastHeight = 0,
							margin = frameMargin,
							resizeMethod = null;


						if (typeof window.frameLoader === "undefined")
						{
							window.frameLoader = {mutob: null, contentHeight: 0};
						}


						resizeMethod = function()
						{
							var bodyHeight = $(document.body).height(),
								docHeight = $(document).height(),
								method = null,
								newHeight = docHeight,
								winHeight = $(window).height();


							// When to use 'bodyHeight' vs 'docHeight'.  'docHeight' can grow to the size of the iFrame.
							if (bodyHeight < docHeight && docHeight === winHeight)
							{
								newHeight = bodyHeight;
							}


							if (document.documentElement.scrollHeight < docHeight)
							{
								newHeight = $(document.documentElement).height() + margin;
							}


							// Only resize when the width has changed.
							if (
								(
									winHeight < newHeight || 
									(winHeight > newHeight && Math.abs(winHeight - newHeight) > margin)
								) &&
								window.frameLoader.contentHeight !== newHeight
							)
							{
								window.frameLoader.contentHeight = newHeight;

								method = function(frameID, height)
								{
									$("#" + frameID).height(height);
								};

								$(window).messenger("execute", method, [fID, newHeight]);
							}
						};


						// Mutation observer is used for items being loaded in from AJAX requests that cause the window to change.
						window.frameLoader.mutob = new MutationObserver(
							function(mutations)
							{
								mutations.forEach(
									function(mutation)
									{
										if (
											mutation.addedNodes.length > 0 || 
											mutation.removedNodes.length > 0 ||
											(
												mutation.type === "attributes" &&
												(
													(
														mutation.attributeName === "style" &&
														(
															mutation.oldValue.indexOf("display") > -1 ||
															mutation.oldValue.indexOf("height") > -1 ||
															mutation.oldValue.indexOf("width") > -1
														)
													) ||
													mutation.attributeName === "src"
												)
											)
										)
										{
											resizeMethod();
										}
									}
								);
							}
						);


						window.frameLoader.mutob.observe(
							document.documentElement,
							{
								attributes: true,
								characterData: true,
								childList: true,
								subtree: true,
								attributeOldValue: true,
								characterDataOldValue: true
							}
						);


						setTimeout(
							function()
							{
								window.frameLoader.mutob.disconnect();
							},
							5000
						);



						$(window).on("resize", resizeMethod);
						resizeMethod();
					};


					$(window).messenger("execute", method, [this._frameID, this._margin], this._frameID);
				},


				_isType: function(value, type)
				{
					if (value != undefined && value != null && (type === undefined || $.type(value) === type))
					{
						return true;
					}

					return false;
				},


				_parseOrigin: function(source)
				{
					var origin = "",
						path = source.replace("//", "/").split("/");


					// Handle path like (./frame.html, ../frame.html, /frame.html or frame.html)
					// Should be a local origin.
					if (path.length === 1 || (path.length > 1 && (path[0] === "." || path[0] === "..")))
					{
						origin = window.location.origin;
					}


					// Handle path like (http://domain.com)
					else if (path.length > 1 && path[0].toLowerCase() === "http:" && path[1].indexOf(".") > -1)
					{
						origin = path[0].toLowerCase() + "//" + path[1].toLowerCase();
					}


					// Handle path like (https://domain.com)
					else if (path.length > 1 && path[0].toLowerCase() === "https:" && path[1].indexOf(".") > -1)
					{
						origin = path[0].toLowerCase() + "//" + path[1].toLowerCase();
					}


					return origin;
				},


				_processMessage: function(message)
				{
					if (message.action == "registrationComplete" && message.frameID == this._frameID)
					{
						this._registrationComplete = true;
						this._registrationAttempts = 0;
						this._installResizer();
					}
				},


				_registerParentWithFrame: function()
				{
					var $this = this,
						method = null,
						origin = window.location.origin;


					if (!this._registrationComplete && this._registrationAttempts < 3)
					{
						method = function(origin, frameID)
						{
							$(window).messenger("registerWindow", "parent", window.parent, origin, true);

							$(window).messenger("post", {action: "registrationComplete", frameID: frameID}, "frameLoader");
						};


						$(window).messenger("execute", method, [origin, this._frameID], this._frameID);

						this._registrationAttempts++;

						setTimeout(
							function()
							{
								$this._registerParentWithFrame.apply($this, []);
							},
							200
						);
					}
				},


				_setOption: function(key, value)
				{
					var $plugin = this;


					switch (String(key).toLowerCase())
					{
						case "somevalue":
							// $plugin.options.someValue = doSomething(value);
							break;

						default:
							$plugin.options[key] = value;
							break;
					}
	
					$plugin._super("_setOption", key, value);
				},




				/*************************/
				/*    Private Values     */
				/*************************/
				_frameID: null,
				_frameInitialLoadComplete: false,
				_margin: 20,
				_registrationAttempts: 0,
				_registrationComplete: false
			};


			var scriptTag = document.currentScript;




			// Register widget definition with jQuery UI Widget factory
			$.widget("frame.frameLoader", frameLoaderDefinition);


			// Load widget
			$("<iframe></iframe>").insertAfter(scriptTag).frameLoader();
		}
	)(jQuery, window, document);
}
