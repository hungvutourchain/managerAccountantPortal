import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, EventEmitter, Output, Input } from '@angular/core';
import { merge, Observable, of, Subject, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { defaultLanguage, languages } from '../../models/languages';
import { SpeechError } from '../../models/speech-error';
import { SpeechEvent } from '../../models/speech-event';
import { SpeechRecognizerService } from '../../services/web-apis/speech-recognizer.service';
import { ActionContext } from '../../services/actions/action-context';
import { SpeechNotification } from '../../models/speech-notification';
import { LocalStorageService } from 'angular-web-storage';

@Component({
  standalone: false,
  selector: 'wsa-speech',
  templateUrl: './speech.component.html',
  styleUrls: ['./speech.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeechComponent implements OnInit, OnDestroy {
  // Input configurations
  @Input() showTranscript = true;
  @Input() showHint = true;
  @Input() languageLabel = 'Language';
  @Input() autoStopOnFinal = true;

  // Output events
  @Output() speechResult = new EventEmitter<string>();
  @Output() interimResult = new EventEmitter<string>();
  @Output() listeningChange = new EventEmitter<boolean>();
  /** @deprecated Use speechResult instead */
  @Output() outSpeech = new EventEmitter<string>();

  // Dropdown settings
  public filterSettings: any = {
    caseSensitive: false,
    operator: 'contains'
  };

  // Language settings
  languages = languages;
  currentLanguage = defaultLanguage.code;

  // State
  isSupported = false;
  isListening = false;
  currentTranscript = '';
  isFinalTranscript = false;

  // Observables
  errorMessage$?: Observable<string>;
  private defaultError$ = new Subject<string | undefined>();
  private subscriptions: Subscription[] = [];

  constructor(
    private speechRecognizer: SpeechRecognizerService,
    private local: LocalStorageService,
    private actionContext: ActionContext,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLanguagePreference();
    this.isSupported = this.speechRecognizer.initialize(this.currentLanguage);
    
    if (this.isSupported) {
      this.initRecognition();
    } else {
      this.errorMessage$ = of('Your browser does not support speech recognition. Please use Chrome or Edge.');
    }
  }

  ngOnDestroy(): void {
    this.stop();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleListening(): void {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  start(): void {
    if (!this.isSupported || this.isListening) return;

    this.defaultError$.next(undefined);
    this.currentTranscript = '';
    this.isFinalTranscript = false;
    this.speechRecognizer.start();
    this.cdr.markForCheck();
  }

  stop(): void {
    if (!this.isListening) return;
    this.speechRecognizer.stop();
    this.cdr.markForCheck();
  }

  selectLanguage(language: string): void {
    if (this.isListening) {
      this.stop();
    }
    this.currentLanguage = language;
    this.saveLanguagePreference();
    this.speechRecognizer.setLanguage(this.currentLanguage);
  }

  private loadLanguagePreference(): void {
    const savedLanguage = this.local.get('languageSpeech');
    if (savedLanguage) {
      this.currentLanguage = savedLanguage;
    } else {
      this.currentLanguage = 'en-US';
      this.saveLanguagePreference();
    }
  }

  private saveLanguagePreference(): void {
    this.local.set('languageSpeech', this.currentLanguage);
  }

  private initRecognition(): void {
    // Handle transcript results
    const transcriptSub = this.speechRecognizer.onResult().pipe(
      tap((notification) => this.processNotification(notification))
    ).subscribe();
    this.subscriptions.push(transcriptSub);

    // Handle listening state
    const listeningSub = merge(
      this.speechRecognizer.onStart(),
      this.speechRecognizer.onEnd()
    ).pipe(
      tap((notification) => {
        this.isListening = notification.event === SpeechEvent.Start;
        this.listeningChange.emit(this.isListening);
        this.cdr.markForCheck();
      })
    ).subscribe();
    this.subscriptions.push(listeningSub);

    // Handle errors
    this.errorMessage$ = merge(
      this.speechRecognizer.onError(),
      this.defaultError$
    ).pipe(
      map((data) => {
        if (data === undefined) return '';
        if (typeof data === 'string') return data;
        if (data.error) {
          return this.getErrorMessage(data.error);
        }
        return '';
      })
    );
  }

  private getErrorMessage(error: SpeechError): string {
    switch (error) {
      case SpeechError.NotAllowed:
        return 'Microphone access denied. Please allow microphone permissions in your browser settings.';
      case SpeechError.NoSpeech:
        return 'No speech detected. Please try again.';
      case SpeechError.AudioCapture:
        return 'Microphone not available. Please check your microphone connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  private processNotification(notification: SpeechNotification<string>): void {
    const content = notification.content?.trim() || '';

    if (notification.event === SpeechEvent.FinalContent) {
      this.currentTranscript = content;
      this.isFinalTranscript = true;
      
      // Emit events
      this.speechResult.emit(content);
      this.outSpeech.emit(content); // Backward compatibility
      
      // Process with action context
      this.actionContext.processMessage(content, this.currentLanguage);
      
      // Auto stop if configured
      if (this.autoStopOnFinal) {
        this.speechRecognizer.stop();
      }
    } else if (notification.event === SpeechEvent.InterimContent) {
      this.currentTranscript = content;
      this.isFinalTranscript = false;
      this.interimResult.emit(content);
    }

    this.cdr.markForCheck();
  }
}
